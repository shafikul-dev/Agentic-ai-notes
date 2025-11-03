"""
Memory Management with LangGraph
=================================

This file demonstrates how to implement memory in LangGraph for managing
both short-term (conversation state) and long-term (persistent knowledge) memory.

For the conceptual overview, see: 08_memory_management.py

LangGraph provides more advanced memory management with:
- Checkpointers: For short-term memory (conversation state persistence)
- Stores: For long-term memory (persistent knowledge across sessions)

Use LangGraph when you need:
- Complex agent workflows with state management
- Resume conversations after restarting
- Store and retrieve information across different sessions
"""

import os
from dotenv import load_dotenv
from typing import TypedDict

def setup_environment():
    """Loads environment variables and checks for the required API key."""
    load_dotenv()
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY not found. Please set it in your .env file.")


# ============================================================================
# Example 4: Short-Term Memory with Checkpointer (Conversation State)
# ============================================================================

def example_langgraph_short_term_memory():
    """
    LangGraph Short-Term Memory: Using MemorySaver Checkpointer
    
    ✅ Use when: You want to resume conversations after restarting
    ✅ Use when: You need state persistence within a session
    ✅ Use when: Building multi-step agent workflows
    
    How it works:
    ------------
    1. Define your state (TypedDict with messages)
    2. Create checkpointer (MemorySaver)
    3. Compile graph with checkpointer
    4. Use thread_id to resume conversations
    5. State persists across invocations
    
    Quick Reference:
    ----------------
    from langgraph.checkpoint.memory import MemorySaver
    from langgraph.graph import StateGraph, END
    
    # Define state
    class AgentState(TypedDict):
        messages: list
    
    # Create checkpointer
    memory = MemorySaver()
    
    # Compile with checkpointer
    app = graph.compile(checkpointer=memory)
    
    # Use thread_id to maintain conversation
    config = {"configurable": {"thread_id": "conversation-1"}}
    app.invoke(initial_state, config=config)
    """
    print("--- Example 4: LangGraph Short-Term Memory (Checkpointer) ---")
    
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver
    
    setup_environment()
    
    # Define state structure
    class ConversationState(TypedDict):
        messages: list  # Conversation history stored here
    
    # Initialize LLM
    llm = ChatOpenAI(model="gpt-4-turbo", temperature=0.7)
    
    def chatbot_node(state: ConversationState) -> ConversationState:
        """Simple chatbot node that responds to messages."""
        # Get all messages from state
        messages = state["messages"]
        
        # Get response from LLM
        response = llm.invoke(messages)
        
        # Add AI response to messages
        return {"messages": messages + [response]}
    
    # Build the graph
    graph = StateGraph(ConversationState)
    graph.add_node("chatbot", chatbot_node)
    graph.add_edge("chatbot", END)
    graph.set_entry_point("chatbot")
    
    # Create checkpointer for memory persistence
    memory = MemorySaver()
    
    # Compile with checkpointer
    app = graph.compile(checkpointer=memory)
    
    # Create a unique thread_id for this conversation
    thread_id = "conversation-1"
    config = {"configurable": {"thread_id": thread_id}}
    
    print("=== First Message ===")
    initial_state = {
        "messages": [
            SystemMessage(content="You are a helpful assistant."),
            HumanMessage(content="Hi! My name is Alice.")
        ]
    }
    result1 = app.invoke(initial_state, config=config)
    print(f"User: {initial_state['messages'][-1].content}")
    print(f"Assistant: {result1['messages'][-1].content}\n")
    
    print("=== Second Message (Same Thread - Remembers Context) ===")
    # Continue conversation - state is automatically loaded!
    result2 = app.invoke(
        {"messages": [HumanMessage(content="What's my name?")]},
        config=config  # Same thread_id = same conversation
    )
    print(f"User: What's my name?")
    print(f"Assistant: {result2['messages'][-1].content}\n")
    
    print("=== New Thread (Different Conversation - No Memory) ===")
    # New thread = new conversation (no memory from previous)
    new_thread_id = "conversation-2"
    new_config = {"configurable": {"thread_id": new_thread_id}}
    result3 = app.invoke(
        {"messages": [HumanMessage(content="What's my name?")]},
        config=new_config  # Different thread_id = fresh start
    )
    print(f"User: What's my name?")
    print(f"Assistant: {result3['messages'][-1].content}\n")
    
    print("✅ Short-term memory persists within thread_id\n")


# ============================================================================
# Example 5: Long-Term Memory with Store (Persistent Knowledge)
# ============================================================================

def example_langgraph_long_term_memory():
    """
    LangGraph Long-Term Memory: Using InMemoryStore
    
    ✅ Use when: Storing information across different sessions
    ✅ Use when: Building personalized experiences
    ✅ Use when: Agents need to learn and remember facts
    
    Three Types of Long-Term Memory:
    ---------------------------------
    1. Semantic Memory: Facts, preferences (user likes coffee)
    2. Episodic Memory: Past events/experiences (conversation from last week)
    3. Procedural Memory: Rules, instructions (how to do something)
    
    How it works:
    ------------
    1. Create a store (InMemoryStore or database-backed)
    2. Use namespaces to organize memories (like folders)
    3. Store key-value pairs with optional metadata
    4. Search by content or similarity
    5. Retrieve across different conversations
    
    Quick Reference:
    ----------------
    from langgraph.store.memory import InMemoryStore
    
    # Initialize store
    store = InMemoryStore(index={"embed": embed_function, "dims": 384})
    
    # Store a memory
    namespace = ("user_123", "preferences")
    store.put(namespace, "coffee_preference", {"drink": "espresso", "milk": "no"})
    
    # Retrieve a memory
    memory = store.get(namespace, "coffee_preference")
    
    # Search memories
    results = store.search(namespace, query="coffee preferences")
    """
    print("--- Example 5: LangGraph Long-Term Memory (Store) ---")
    
    from langgraph.store.memory import InMemoryStore
    from langchain_openai import OpenAIEmbeddings
    
    setup_environment()
    
    # Simple embedding function (in production, use proper embedding model)
    def simple_embed(texts: list[str]) -> list[list[float]]:
        """Simple embedding - in production use OpenAIEmbeddings or similar."""
        # For demo, return simple vectors (real apps use proper embeddings)
        embeddings_model = OpenAIEmbeddings()
        return embeddings_model.embed_documents(texts)
    
    # Initialize store with embedding function
    store = InMemoryStore(
        index={"embed": simple_embed, "dims": 1536}  # OpenAI embeddings are 1536 dims
    )
    
    # Define namespace (like a folder) for organizing memories
    user_id = "user_alice"
    app_context = "personal_assistant"
    namespace = (user_id, app_context)
    
    print("=== Storing Semantic Memory (Facts/Preferences) ===")
    # Store user preferences (Semantic Memory)
    store.put(
        namespace,
        "user_preferences",  # Key
        {
            "favorite_coffee": "cappuccino",
            "preferred_language": "English",
            "timezone": "EST",
            "allergies": ["peanuts", "shellfish"]
        }
    )
    print("✅ Stored user preferences\n")
    
    print("=== Retrieving Semantic Memory ===")
    # Retrieve preferences
    preferences = store.get(namespace, "user_preferences")
    if preferences:
        print(f"Retrieved preferences: {preferences[0].value}")
        print(f"Allergies: {preferences[0].value.get('allergies', [])}\n")
    
    print("=== Storing Episodic Memory (Past Events) ===")
    # Store past conversation summary (Episodic Memory)
    store.put(
        namespace,
        "last_conversation_summary",
        {
            "date": "2024-01-15",
            "topic": "Travel planning",
            "key_points": [
                "User planning trip to Paris",
                "Preference for vegetarian restaurants",
                "Budget: $2000"
            ]
        }
    )
    print("✅ Stored episodic memory (past conversation)\n")
    
    print("=== Storing Procedural Memory (Rules/Instructions) ===")
    # Store agent instructions/rules (Procedural Memory)
    store.put(
        namespace,
        "agent_instructions",
        {
            "response_style": "friendly and concise",
            "always_ask_for_clarification": True,
            "formatting_rules": [
                "Use bullet points for lists",
                "Always include examples when explaining concepts",
                "Keep responses under 300 words unless user asks for details"
            ],
            "special_handling": {
                "allergies": "Always check allergies before suggesting food",
                "budget": "Respect user's stated budget limits"
            }
        }
    )
    print("✅ Stored procedural memory (agent rules/instructions)\n")
    
    print("=== Searching Long-Term Memory ===")
    # Search for relevant memories by query
    search_results = store.search(
        namespace,
        query="food preferences and allergies",
        limit=3
    )
    print(f"Found {len(search_results)} relevant memories:")
    for result in search_results:
        print(f"  - {result.key}: {result.value}\n")
    
    print("=== Using Memory in Agent State ===")
    # Example: Agent can access store in its nodes
    class AgentStateWithMemory(TypedDict):
        messages: list
        user_id: str
        retrieved_memories: list  # Memories loaded from store
    
    def agent_with_memory(state: AgentStateWithMemory, store: InMemoryStore) -> AgentStateWithMemory:
        """Agent node that retrieves and uses long-term memory."""
        user_id = state["user_id"]
        namespace = (user_id, "personal_assistant")
        
        # Retrieve user preferences from long-term memory
        preferences = store.get(namespace, "user_preferences")
        
        if preferences:
            print(f"Agent retrieved preferences: {preferences[0].value}")
            # Use preferences to personalize response
            return {
                **state,
                "retrieved_memories": [preferences[0].value]
            }
        return state
    
    print("✅ Long-term memory can be accessed across different sessions\n")


# ============================================================================
# Example 6: Combined Short-Term + Long-Term Memory
# ============================================================================

def example_combined_memory():
    """
    Combining Short-Term and Long-Term Memory
    
    ✅ Real-world pattern: Load long-term memory into short-term context
    ✅ Best practice: Retrieve relevant long-term memories when conversation starts
    ✅ Use when: Building production-ready personalized agents
    
    How it works:
    ------------
    1. User starts conversation
    2. Agent retrieves relevant long-term memories (preferences, past context)
    3. Agent loads them into short-term state (current conversation)
    4. Agent uses both to generate personalized response
    5. Agent saves important info to long-term memory
    """
    print("--- Example 6: Combining Short-Term + Long-Term Memory ---")
    
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage
    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.memory import MemorySaver
    from langgraph.store.memory import InMemoryStore
    
    setup_environment()
    
    # Initialize stores
    checkpointer = MemorySaver()  # Short-term memory
    long_term_store = InMemoryStore()  # Long-term memory
    
    # Set up long-term memory (simulate existing data)
    namespace = ("user_bob", "assistant")
    long_term_store.put(
        namespace,
        "preferences",
        {"favorite_topics": ["AI", "python", "cooking"], "name": "Bob"}
    )
    
    # Define state
    class CombinedMemoryState(TypedDict):
        messages: list
        user_id: str
        loaded_preferences: dict
    
    # Initialize LLM
    llm = ChatOpenAI(model="gpt-4-turbo", temperature=0.7)
    
    def load_memory_node(state: CombinedMemoryState) -> CombinedMemoryState:
        """Load long-term memory into short-term context."""
        user_id = state["user_id"]
        namespace = (user_id, "assistant")
        
        # Retrieve from long-term memory
        prefs = long_term_store.get(namespace, "preferences")
        
        if prefs:
            preferences = prefs[0].value
            print(f"📚 Loaded preferences from long-term memory: {preferences}")
            
            # Add to system message for context
            system_msg = SystemMessage(
                content=f"User preferences: {preferences}. Use this to personalize responses."
            )
            
            return {
                **state,
                "messages": [system_msg] + state["messages"],
                "loaded_preferences": preferences
            }
        
        return state
    
    def chat_node(state: CombinedMemoryState) -> CombinedMemoryState:
        """Chat node that uses both short-term and long-term context."""
        messages = state["messages"]
        response = llm.invoke(messages)
        return {"messages": messages + [response]}
    
    # Build graph
    graph = StateGraph(CombinedMemoryState)
    graph.add_node("load_memory", load_memory_node)
    graph.add_node("chat", chat_node)
    graph.set_entry_point("load_memory")
    graph.add_edge("load_memory", "chat")
    graph.add_edge("chat", END)
    
    # Compile with checkpointer
    app = graph.compile(checkpointer=checkpointer)
    
    # Run conversation
    thread_id = "bob-conversation-1"
    config = {"configurable": {"thread_id": thread_id}}
    
    print("\n=== Conversation with Combined Memory ===")
    result = app.invoke(
        {
            "messages": [HumanMessage(content="What are my favorite topics?")],
            "user_id": "user_bob",
            "loaded_preferences": {}
        },
        config=config
    )
    
    print(f"User: What are my favorite topics?")
    print(f"Assistant: {result['messages'][-1].content}\n")
    
    print("✅ Short-term memory (conversation) + Long-term memory (preferences) = Personalized experience!\n")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("LANGGRAPH MEMORY EXAMPLES")
    print("="*70)
    print("\nFor conceptual overview, see: 08_memory_management.py\n")
    
    # Uncomment the examples you want to run:
    
    # example_langgraph_short_term_memory()
    # example_langgraph_long_term_memory()
    # example_combined_memory()
    
    print("💡 Tip: Uncomment examples above to see them in action!")
    print("💡 Tip: Check the docstrings for quick reference code snippets!\n")

