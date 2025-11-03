"""
Equivalent implementation using LangGraph instead of CrewAI.
This shows the same "plan then write" workflow with more control and transparency.
"""
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, END
from typing import TypedDict

load_dotenv()

# Define state structure
class WritingState(TypedDict):
    topic: str
    plan: str
    summary: str
    messages: list

llm = ChatOpenAI(model="gpt-4-turbo")

def create_plan_node(state: WritingState) -> WritingState:
    """Step 1: Create a bullet-point plan"""
    prompt = f"""You are an expert technical writer and content strategist.
Create a bullet-point plan for a summary on the topic: '{state['topic']}'.

Output only the plan as a bulleted list."""

    messages = [
        SystemMessage(content="You are an expert technical writer and content strategist."),
        HumanMessage(content=prompt)
    ]
    
    response = llm.invoke(messages)
    plan = response.content
    
    print("\n--- 📋 Plan Created ---")
    print(plan)
    
    return {
        **state,
        "plan": plan,
        "messages": state.get("messages", []) + [messages[0], messages[1], response]
    }

def write_summary_node(state: WritingState) -> WritingState:
    """Step 2: Write summary based on the plan"""
    prompt = f"""Based on this plan:
{state['plan']}

Write a concise and well-structured summary on the topic: '{state['topic']}'.
Keep it around 200 words."""

    messages = state.get("messages", []) + [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    summary = response.content
    
    print("\n--- ✍️ Summary Written ---")
    print(summary)
    
    return {
        **state,
        "summary": summary,
        "messages": messages + [response]
    }

# Build the graph
workflow = StateGraph(WritingState)

workflow.add_node("plan", create_plan_node)
workflow.add_node("write", write_summary_node)

workflow.set_entry_point("plan")
workflow.add_edge("plan", "write")
workflow.add_edge("write", END)

app = workflow.compile()

# Execute
topic = "The importance of Reinforcement Learning in AI"
print("## Running the planning and writing task ##")

initial_state = {
    "topic": topic,
    "plan": "",
    "summary": "",
    "messages": []
}

result = app.invoke(initial_state)

print("\n\n---\n## Task Result ##\n---")
print("### Plan")
print(result["plan"])
print("\n### Summary")
print(result["summary"])

