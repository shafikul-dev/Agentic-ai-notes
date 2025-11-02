import os, getpass
import asyncio
import nest_asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool as langchain_tool
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent
# UNCOMMENT
# Prompt the user securely and set API keys as an environment variables
load_dotenv()
try:
    # A model with function/tool calling capabilities is required.
    model_name = "gpt-4o"
    llm = ChatOpenAI(model=model_name, temperature=0)
    print(f"✅ Language model initialized: {model_name}")
except Exception as e:
    print(f"🛑 Exception: Error initializing language model: {e}")
    llm = None
# --- Define a Tool ---
# @langchain_tool decorator converts this Python function into a LangChain tool
# The LLM will see:
#   - Function name: search_information
#   - Description: From the docstring below
#   - Parameters: query (str) - extracted from function signature
# When LLM decides to use this tool, it will generate a JSON call like:
#   {"name": "search_information", "arguments": {"query": "capital of France"}}
@langchain_tool
def search_information(query: str) -> str:
    """
    Provides factual information on a given topic. Use this tool to
    find answers to phrases like 'capital of France' or 'weather in London?'.
    
    This docstring becomes the tool's description that the LLM reads.
    The LLM uses this to decide WHEN to call this tool.
    """
    # THIS FUNCTION ONLY RUNS WHEN:
    # 1. LLM generates a tool call with this function's name
    # 2. Agent executor intercepts it
    # 3. Agent executor extracts parameters from LLM's JSON call
    # 4. Agent executor calls: search_information(query="value from LLM")
    print(f"\n--- 🛠️ Tool Called: search_information with query: '{query}' ---")
    # Simulate a search tool with a dictionary of predefined results.
    simulated_results = {
        "weather in london": "The weather in London is currently cloudy with a temperature of 15°C.",
        "capital of france": "The capital of France is Paris.",
        "population of earth": "The estimated population of Earth is around 8 billion people.",
        "tallest mountain": "Mount Everest is the tallest mountain above sea level.",
        "default": f"Simulated search result for '{query}': No specific information found, but the topic seems interesting."
    }
    result = simulated_results.get(query.lower(), simulated_results["default"])
    print(f"--- TOOL RESULT: {result} ---")
    return result
tools = [search_information]

# --- Create a Tool-Calling Agent ---
if llm:
    # STEP 1: create_react_agent() converts tools to JSON schemas
    # STEP 2: Makes these schemas available to the LLM
    # STEP 3: Sets up a pipeline that:
    #   - Sends user query + available tools to LLM
    #   - LLM decides if it should use a tool
    #   - If yes, LLM returns a tool call JSON
    #   - Agent executor intercepts and runs the actual Python function
    #   - Function result is sent back to LLM
    #   - LLM generates final response
    agent_executor = create_react_agent(llm, tools)
else:
    agent_executor = None
async def run_agent_with_tool(query: str):
    """Invokes the agent executor with a query and prints the final response."""
    if agent_executor is None:
        print("⚠️ Agent executor not initialized. Please check your API keys.")
        return
    print(f"\n--- 🏃 Running Agent with Query: '{query}' ---")
    try:
        # EXECUTION FLOW:
        # 1. User query sent to agent_executor
        # 2. Agent sends query + tool schemas to LLM
        # 3. LLM processes: "Do I need to use a tool?"
        # 4. If YES → LLM returns tool call JSON
        # 5. Agent executor runs the Python function with LLM's parameters
        # 6. Tool result goes back to LLM
        # 7. LLM generates final answer incorporating tool result
        # 8. Final response returned here
        response = await agent_executor.ainvoke({"messages": [HumanMessage(content=query)]})
        print("\n--- ✅ Final Agent Response ---")
        # LangGraph returns messages, get the last assistant message
        if response.get("messages"):
            last_message = response["messages"][-1]
            print(last_message.content if hasattr(last_message, 'content') else last_message)
        else:
            print(response)
    except Exception as e:
        print(f"\n🛑 Exception: An error occurred during agent execution: {e}")
async def main():
    """Runs all agent queries concurrently."""
    tasks = [
        run_agent_with_tool("What is the capital of France?"),
        run_agent_with_tool("What's the weather like in London?"),
        run_agent_with_tool("Tell me something about dogs.")  # Should trigger the default tool response
    ]
    await asyncio.gather(*tasks)
nest_asyncio.apply()
asyncio.run(main())