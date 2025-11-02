"""
🔧 HOW TOOLS WORK IN LANGCHAIN - DETAILED EXPLANATION
=======================================================

This script demonstrates how LLM tool calling works step by step.
"""

import json
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# STEP 1: DEFINING A TOOL
# ============================================================================

@tool
def calculate_age(birth_year: int, current_year: int = 2024) -> str:
    """
    Calculates a person's age based on birth year and current year.
    
    Args:
        birth_year: The year the person was born
        current_year: The current year (defaults to 2024)
    
    Returns:
        A string describing the person's age
    """
    age = current_year - birth_year
    print(f"🔧 TOOL EXECUTED: calculate_age(birth_year={birth_year}, current_year={current_year})")
    return f"The person is {age} years old."


@tool
def get_capital(country: str) -> str:
    """
    Returns the capital city of a given country.
    
    Args:
        country: The name of the country
    
    Returns:
        The capital city name
    """
    capitals = {
        "france": "Paris",
        "spain": "Madrid",
        "italy": "Rome",
        "germany": "Berlin",
        "japan": "Tokyo"
    }
    capital = capitals.get(country.lower(), "Unknown")
    print(f"🔧 TOOL EXECUTED: get_capital(country='{country}')")
    return f"The capital of {country} is {capital}."


# ============================================================================
# STEP 2: TOOLS ARE CONVERTED TO JSON SCHEMA
# ============================================================================

print("=" * 70)
print("STEP 1: TOOL DEFINITION & SCHEMA")
print("=" * 70)

tools = [calculate_age, get_capital]

print("\n📋 Available tools:")
for tool in tools:
    print(f"  - {tool.name}")
    print(f"    Description: {tool.description}")
    print(f"    Parameters: {tool.args}")
    print()


# ============================================================================
# STEP 3: HOW LLM SEES THE TOOLS
# ============================================================================

print("=" * 70)
print("STEP 2: HOW LLM RECEIVES TOOL INFORMATION")
print("=" * 70)

print("\n🧠 When you pass tools to create_react_agent(), here's what happens:")
print("""
1. Each tool is converted to a JSON schema that describes:
   - Tool name
   - Description (from docstring)
   - Parameters (from function signature)
   - Parameter types and requirements

2. This schema is sent to the LLM in a special format that tells it:
   "Hey, you can call these functions if needed!"

3. The LLM learns what tools are available and when to use them.
""")

# Let's see the actual schema:
print("\n📄 Example tool schema (what LLM sees):")
example_schema = {
    "name": "get_capital",
    "description": "Returns the capital city of a given country.",
    "parameters": {
        "type": "object",
        "properties": {
            "country": {
                "type": "string",
                "description": "The name of the country"
            }
        },
        "required": ["country"]
    }
}
print(json.dumps(example_schema, indent=2))


# ============================================================================
# STEP 4: THE EXECUTION FLOW
# ============================================================================

print("\n" + "=" * 70)
print("STEP 3: EXECUTION FLOW - WHEN TOOL IS CALLED")
print("=" * 70)

print("""
🔄 THE COMPLETE FLOW:

1. USER QUERY
   👤 User: "What is the capital of France?"

2. LLM DECISION
   🧠 LLM thinks: "I need to use the get_capital tool for this"
   
3. LLM GENERATES TOOL CALL
   🤖 LLM returns: {
        "tool_calls": [{
            "name": "get_capital",
            "arguments": {"country": "France"}
        }]
    }

4. AGENT EXECUTOR INTERCEPTS
   ⚙️ Agent sees tool call → Finds the tool function → Executes it

5. TOOL FUNCTION EXECUTES
   🔧 Python function runs: get_capital(country="France")
   
6. TOOL RETURNS RESULT
   📤 Function returns: "The capital of France is Paris."

7. RESULT GOES BACK TO LLM
   🔄 Agent sends result back to LLM: "Tool result: The capital of France is Paris."
   
8. LLM GENERATES FINAL RESPONSE
   💬 LLM: "The capital of France is Paris."
""")


# ============================================================================
# STEP 5: DEMONSTRATION WITH ACTUAL LLM
# ============================================================================

print("\n" + "=" * 70)
print("STEP 4: LIVE DEMONSTRATION")
print("=" * 70)

print("\n🎯 Demonstrating tool calling...")
print("   (This requires an OpenAI API key)\n")

try:
    # Bind tools to LLM
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    llm_with_tools = llm.bind_tools(tools)
    
    print("✅ LLM initialized with tools bound")
    print("   When you call bind_tools(), the LLM can now:")
    print("   - See all available tools and their schemas")
    print("   - Decide when to call them")
    print("   - Generate tool calls with correct parameters\n")
    
    # Example query
    query = "What is the capital of France and how old is someone born in 1990?"
    
    print(f"📝 User Query: {query}\n")
    
    # Get LLM response with potential tool calls
    messages = [HumanMessage(content=query)]
    response = llm_with_tools.invoke(messages)
    
    print("🤖 LLM Response (raw):")
    print(f"   Content: {response.content}")
    print(f"   Tool Calls: {response.tool_calls if hasattr(response, 'tool_calls') else 'None'}\n")
    
    if hasattr(response, 'tool_calls') and response.tool_calls:
        print("🎉 LLM DECIDED TO USE TOOLS!")
        print("\n   Tool calls detected:")
        for tool_call in response.tool_calls:
            print(f"   - Tool: {tool_call['name']}")
            print(f"     Args: {tool_call['args']}")
            
            # Find and execute the tool
            for tool_func in tools:
                if tool_func.name == tool_call['name']:
                    print(f"\n   🔧 Executing tool function...")
                    result = tool_func.invoke(tool_call['args'])
                    print(f"   ✅ Result: {result}")
                    break
    else:
        print("ℹ️  LLM responded directly without tool calls")
        
except Exception as e:
    print(f"⚠️  Could not run demonstration: {e}")
    print("   (This is okay - the explanation above still applies)")


# ============================================================================
# KEY TAKEAWAYS
# ============================================================================

print("\n" + "=" * 70)
print("KEY TAKEAWAYS")
print("=" * 70)

print("""
✅ YES, YOU'RE RIGHT! Here's the summary:

1. **Tool Registration**: 
   - @tool decorator converts your Python function into a LangChain tool
   - Tool metadata (name, description, parameters) is extracted from function signature

2. **Tool Binding**:
   - When you pass tools to create_react_agent(llm, tools), the agent:
     * Converts tools to JSON schemas
     * Makes them available to the LLM
     * Sets up the execution pipeline

3. **LLM Decision**:
   - LLM analyzes user query
   - Decides if a tool would help answer it
   - If yes, generates a tool call with parameters

4. **Tool Execution**:
   - Agent executor intercepts the tool call
   - Finds matching Python function
   - Extracts parameters from LLM's tool call
   - Calls: tool_function(**parameters)
   - Returns result back to LLM

5. **Final Response**:
   - LLM receives tool result
   - Incorporates it into final answer
   - Returns to user

🎯 THE MAGIC: The LLM never directly calls your Python function!
   Instead, it generates a JSON tool call, which the agent executor
   then converts into an actual function call. This is the "tool calling"
   or "function calling" mechanism.
""")

