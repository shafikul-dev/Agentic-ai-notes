"""
Memory Management in LangChain and LangGraph
============================================

This tutorial explains how agents remember information - both short-term (current conversation)
and long-term (across multiple sessions). Think of it like human memory:
- Short-term: What you're thinking about right now (conversation history)
- Long-term: Things you learned before that you can recall later (persistent storage)

Perfect for: Chatbots, task-oriented agents, personalized experiences, learning systems.

This file provides the conceptual overview. For practical examples, see:
- 08_memory_langchain.py - LangChain memory examples
- 08_memory_langgraph.py - LangGraph memory examples
"""

# ============================================================================
# SECTION 1: UNDERSTANDING MEMORY - THE SIMPLE EXPLANATION
# ============================================================================

"""
📚 MEMORY MANAGEMENT EXPLAINED SIMPLY
--------------------------------------

🤔 Why Do Agents Need Memory?
-------------------------------
Without memory, agents are like goldfish - they forget everything after each interaction.
With memory, agents can:
- Remember what you said earlier in the conversation
- Learn your preferences over time
- Pick up where they left off
- Get smarter with each interaction

🧠 Two Types of Memory (Like Human Memory)
-------------------------------------------

1. SHORT-TERM MEMORY (Conversation History)
   - What it is: Current conversation context within one chat session
   - Where it lives: Inside the LLM's context window (the messages you send)
   - How long: Just for the current conversation
   - Think of it like: Your "working memory" - what you're thinking about right now
   - Capacity: Limited by context window size (e.g., 128K tokens)
   - Example: "Remember I told you my name is John 5 messages ago"
   
2. LONG-TERM MEMORY (Persistent Storage)
   - What it is: Information saved across multiple conversations
   - Where it lives: External database, vector store, or file system
   - How long: Forever (until you delete it)
   - Think of it like: Your long-term knowledge - things you learned months ago
   - Capacity: Unlimited (limited only by storage)
   - Example: "Remember that last month you preferred vegetarian restaurants"

🔄 How They Work Together
--------------------------
1. User asks a question
2. Agent checks LONG-TERM memory for relevant info (e.g., user preferences)
3. Agent retrieves SHORT-TERM memory (current conversation history)
4. Agent combines both to give a smart, personalized response
5. Agent saves important info to LONG-TERM memory for future use

📊 Quick Decision Guide
------------------------
Use SHORT-TERM memory when:
  ✓ Information is only relevant for current conversation
  ✓ You need immediate context (last few messages)
  ✓ It's temporary/temporary state

Use LONG-TERM memory when:
  ✓ Information should persist across sessions
  ✓ You want to personalize experiences
  ✓ You need to learn from past interactions
  ✓ User preferences, past conversations, learned facts

================================================================================
"""

# ============================================================================
# QUICK REFERENCE GUIDE
# ============================================================================

"""
🎯 QUICK REFERENCE - COPY & PASTE TEMPLATES
===========================================

--- LANGCHAIN: Simple Conversation Memory ---
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = ChatOpenAI(model="gpt-4-turbo")
memory = ConversationBufferMemory(memory_key="history", return_messages=True)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are helpful."),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{question}")
])
chain = LLMChain(llm=llm, prompt=prompt, memory=memory)
response = chain.predict(question="Hello!")

--- LANGGRAPH: Short-Term Memory (Checkpointer) ---
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph

memory = MemorySaver()
app = graph.compile(checkpointer=memory)
config = {"configurable": {"thread_id": "unique-id"}}
result = app.invoke(state, config=config)

--- LANGGRAPH: Long-Term Memory (Store) ---
from langgraph.store.memory import InMemoryStore

store = InMemoryStore()
namespace = ("user_id", "app_context")
store.put(namespace, "key", {"data": "value"})
memory = store.get(namespace, "key")
results = store.search(namespace, query="search query")

--- COMBINED: Best Practice Pattern ---
# 1. Load long-term memory at conversation start
# 2. Inject into short-term state
# 3. Use checkpointer for conversation persistence
# 4. Save important info to long-term store

================================================================================

For detailed examples and walkthroughs, see:
- 08_memory_langchain.py - LangChain memory implementation examples
- 08_memory_langgraph.py - LangGraph memory implementation examples
"""

if __name__ == "__main__":
    print("\n" + "="*70)
    print("MEMORY MANAGEMENT - CONCEPTS & OVERVIEW")
    print("="*70)
    print("\nThis file provides the conceptual overview of memory management.")
    print("\nFor practical examples, run:")
    print("  - 08_memory_langchain.py  (LangChain memory examples)")
    print("  - 08_memory_langgraph.py  (LangGraph memory examples)")
    print("\n" + "="*70 + "\n")
