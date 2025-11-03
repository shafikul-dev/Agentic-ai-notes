"""
Simplest implementation using LangChain chains.
Even simpler than LangGraph when you don't need state management or routing.
"""
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

load_dotenv()

llm = ChatOpenAI(model="gpt-4-turbo")

topic = "The importance of Reinforcement Learning in AI"

# Step 1: Planning prompt
plan_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert technical writer and content strategist."),
    ("human", "Create a bullet-point plan for a summary on the topic: '{topic}'")
])

# Step 2: Writing prompt (takes plan as input)
write_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert technical writer and content strategist."),
    ("human", """Based on this plan:
{plan}

Write a concise and well-structured summary on the topic: '{topic}'.
Keep it around 200 words.""")
])

# Create chain: plan → write
plan_chain = plan_prompt | llm
write_chain = write_prompt | llm

def format_plan_response(response):
    """Extract plan content from LLM response"""
    return {"plan": response.content, "topic": topic}

def format_write_response(response):
    """Extract summary content from LLM response"""
    return {"summary": response.content}

# Compose the chains
full_chain = (
    {"topic": RunnablePassthrough()}
    | plan_chain
    | format_plan_response
    | {"plan": lambda x: x["plan"], "topic": lambda x: x["topic"]}
    | write_chain
    | format_write_response
)

# Execute
print("## Running the planning and writing task ##")

plan_result = plan_chain.invoke({"topic": topic})
print("\n--- 📋 Plan Created ---")
print(plan_result.content)

summary_result = write_chain.invoke({"plan": plan_result.content, "topic": topic})
print("\n--- ✍️ Summary Written ---")
print(summary_result.content)

print("\n\n---\n## Task Result ##\n---")
print("### Plan")
print(plan_result.content)
print("\n### Summary")
print(summary_result.content)

