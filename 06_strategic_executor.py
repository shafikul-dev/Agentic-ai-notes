"""
STRATEGIC EXECUTOR vs REACTIVE AGENT Example

This demonstrates the difference:
- REACTIVE: Just responds immediately
- STRATEGIC: Plans → Executes → Adapts if needed

The "structured approach" transforms reactive into strategic by adding:
1. Planning phase (think before acting)
2. Execution phase (act on the plan)
3. Adaptation phase (revise plan if execution reveals issues)
"""
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing import TypedDict, Literal

load_dotenv()

# Enhanced state that supports strategic execution
class StrategicState(TypedDict):
    topic: str
    plan: str
    execution_result: str
    plan_quality_score: int  # 1-10, how good the plan is
    adaptation_needed: bool
    adapted_plan: str
    final_result: str
    messages: list

llm = ChatOpenAI(model="gpt-4-turbo", temperature=0.7)

def create_plan_node(state: StrategicState) -> StrategicState:
    """
    STEP 1: PLANNING PHASE
    Strategic executor: Thinks BEFORE acting
    """
    prompt = f"""Create a strategic plan for writing about: '{state['topic']}'

Your plan should include:
- Key points to cover
- Structure/order
- Target length considerations

Output a clear, actionable plan."""

    messages = [
        SystemMessage(content="You are a strategic content planner."),
        HumanMessage(content=prompt)
    ]
    
    response = llm.invoke(messages)
    plan = response.content
    
    print("\n--- 📋 STRATEGIC PLANNING PHASE ---")
    print("Agent is thinking strategically before acting...")
    print(f"\nPlan:\n{plan}")
    
    return {
        **state,
        "plan": plan,
        "messages": state.get("messages", []) + messages + [response]
    }

def evaluate_plan_node(state: StrategicState) -> StrategicState:
    """
    STEP 2: PLAN EVALUATION
    Strategic executor: Assesses if plan is good enough
    """
    prompt = f"""Evaluate this plan for writing about '{state['topic']}':

{state['plan']}

Rate the plan quality (1-10) and determine if it needs refinement.
Consider: completeness, clarity, structure, feasibility."""

    messages = state.get("messages", []) + [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    evaluation = response.content
    
    # Simple heuristic: extract score (in real app, use structured output)
    score = 7  # Default
    needs_adaptation = False
    
    # Check if evaluation suggests improvement needed
    if any(word in evaluation.lower() for word in ["improve", "weak", "missing", "unclear", "incomplete"]):
        needs_adaptation = True
        score = 5
    
    print("\n--- 🔍 PLAN EVALUATION PHASE ---")
    print(f"Quality Score: {score}/10")
    print(f"Adaptation Needed: {needs_adaptation}")
    
    return {
        **state,
        "plan_quality_score": score,
        "adaptation_needed": needs_adaptation,
        "messages": messages + [response]
    }

def adapt_plan_node(state: StrategicState) -> StrategicState:
    """
    STEP 3: PLAN ADAPTATION (conditional)
    Strategic executor: Adapts plan if evaluation shows issues
    """
    if not state.get("adaptation_needed", False):
        print("\n--- ⏭️ SKIPPING ADAPTATION ---")
        print("Plan is good enough, proceeding to execution")
        return {**state, "adapted_plan": state["plan"]}
    
    prompt = f"""Improve this plan for '{state['topic']}':

Current Plan:
{state['plan']}

Create a refined, improved version that addresses gaps and weaknesses."""

    messages = state.get("messages", []) + [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    adapted_plan = response.content
    
    print("\n--- 🔄 PLAN ADAPTATION PHASE ---")
    print("Agent detected plan weaknesses, adapting strategically...")
    print(f"\nAdapted Plan:\n{adapted_plan}")
    
    return {
        **state,
        "adapted_plan": adapted_plan,
        "messages": messages + [response]
    }

def execute_plan_node(state: StrategicState) -> StrategicState:
    """
    STEP 4: EXECUTION PHASE
    Strategic executor: Executes the (possibly adapted) plan
    """
    plan_to_use = state.get("adapted_plan") or state["plan"]
    
    prompt = f"""Execute this plan to write about '{state['topic']}':

Plan:
{plan_to_use}

Write a well-structured summary following the plan. Target ~200 words."""

    messages = state.get("messages", []) + [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    result = response.content
    
    print("\n--- ✍️ EXECUTION PHASE ---")
    print("Agent executing the strategic plan...")
    print(f"\nResult:\n{result}")
    
    return {
        **state,
        "execution_result": result,
        "final_result": result,
        "messages": messages + [response]
    }

def should_adapt(state: StrategicState) -> Literal["adapt", "execute"]:
    """
    CONDITIONAL ROUTING
    Strategic executor: Decides whether to adapt plan or proceed
    """
    return "adapt" if state.get("adaptation_needed", False) else "execute"

# Build the strategic executor graph
workflow = StateGraph(StrategicState)

workflow.add_node("plan", create_plan_node)
workflow.add_node("evaluate", evaluate_plan_node)
workflow.add_node("adapt", adapt_plan_node)
workflow.add_node("execute", execute_plan_node)

workflow.set_entry_point("plan")
workflow.add_edge("plan", "evaluate")
workflow.add_conditional_edges(
    "evaluate",
    should_adapt,
    {
        "adapt": "adapt",
        "execute": "execute"
    }
)
workflow.add_edge("adapt", "execute")
workflow.add_edge("execute", END)

app = workflow.compile()

# ============================================
# COMPARISON: Reactive vs Strategic
# ============================================

def reactive_agent(topic: str) -> str:
    """
    REACTIVE AGENT (Simple)
    - No planning
    - Immediate response
    - No adaptation
    """
    prompt = f"Write about '{topic}' in ~200 words."
    messages = [HumanMessage(content=prompt)]
    response = llm.invoke(messages)
    return response.content

def strategic_executor(topic: str) -> dict:
    """
    STRATEGIC EXECUTOR (Structured)
    - Plans first
    - Evaluates plan
    - Adapts if needed
    - Then executes
    """
    initial_state = {
        "topic": topic,
        "plan": "",
        "execution_result": "",
        "plan_quality_score": 0,
        "adaptation_needed": False,
        "adapted_plan": "",
        "final_result": "",
        "messages": []
    }
    return app.invoke(initial_state)

# Demo
if __name__ == "__main__":
    topic = "The importance of Reinforcement Learning in AI"
    
    print("\n" + "="*70)
    print("REACTIVE AGENT (Simple - No Planning)")
    print("="*70)
    reactive_result = reactive_agent(topic)
    print(f"\nResult: {reactive_result[:200]}...")
    
    print("\n" + "="*70)
    print("STRATEGIC EXECUTOR (Structured - Plan → Adapt → Execute)")
    print("="*70)
    strategic_result = strategic_executor(topic)
    
    print("\n" + "="*70)
    print("FINAL COMPARISON")
    print("="*70)
    print("\nReactive: Immediate response, no planning")
    print("Strategic: Planned → Evaluated → Adapted (if needed) → Executed")
    print("\nThe 'structured approach' adds thinking before acting!")



