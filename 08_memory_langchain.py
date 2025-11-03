"""
Memory Management with LangChain
=================================

This file demonstrates how to implement memory in LangChain for managing
conversation history and context.

For the conceptual overview, see: 08_memory_management.py

LangChain provides several memory classes for managing conversation history.
Use these when building conversational chains that need to remember context.
"""

import os
from dotenv import load_dotenv

def setup_environment():
    """Loads environment variables and checks for the required API key."""
    load_dotenv()
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY not found. Please set it in your .env file.")


# ============================================================================
# Example 1: ChatMessageHistory - Manual Memory Management
# ============================================================================

def example_chat_message_history():
    """
    ChatMessageHistory: Manual conversation tracking
    
    ✅ Use when: You want full control over message history
    ✅ Use when: Building custom conversation flows
    ✅ Use when: You need to manually manage when messages are added/removed
    
    Quick Reference:
    ----------------
    from langchain.memory import ChatMessageHistory
    history = ChatMessageHistory()
    history.add_user_message("message")
    history.add_ai_message("message")
    messages = history.messages  # Get all messages
    """
    print("--- Example 1: ChatMessageHistory (Manual Memory) ---")
    
    from langchain.memory import ChatMessageHistory
    
    # Initialize empty history
    history = ChatMessageHistory()
    
    # Add messages manually
    history.add_user_message("I'm planning a trip to Paris next month.")
    history.add_ai_message("That sounds exciting! Paris is beautiful in spring.")
    history.add_user_message("What's the weather usually like there?")
    
    # Retrieve all messages
    print("Conversation History:")
    for i, msg in enumerate(history.messages, 1):
        msg_type = msg.__class__.__name__
        print(f"  {i}. [{msg_type}]: {msg.content}")
    
    print("\n✅ Use this when you need manual control over conversation tracking\n")


# ============================================================================
# Example 2: ConversationBufferMemory - Automated Memory for Chains
# ============================================================================

def example_conversation_buffer_memory():
    """
    ConversationBufferMemory: Automated memory integration with chains
    
    ✅ Use when: Building LLMChain or conversational chains
    ✅ Use when: You want automatic history management
    ✅ Use when: Working with standard LLMs (non-chat models)
    
    Key Parameters:
    ---------------
    - memory_key: Variable name in prompt that holds history (default: "history")
    - return_messages: False = string format (LLM), True = message objects (Chat)
    """
    print("--- Example 2: ConversationBufferMemory (Automated) ---")
    
    from langchain.memory import ConversationBufferMemory
    from langchain_openai import OpenAI
    from langchain.chains import LLMChain
    from langchain.prompts import PromptTemplate
    
    setup_environment()
    
    # Define LLM
    llm = OpenAI(temperature=0, model="gpt-3.5-turbo-instruct")
    
    # Create prompt template with {history} placeholder
    template = """You are a helpful travel assistant.

Previous conversation:
{history}

New question: {question}

Response:"""
    
    prompt = PromptTemplate.from_template(template)
    
    # Initialize memory (for standard LLM - returns string format)
    memory = ConversationBufferMemory(memory_key="history")
    
    # Build chain with memory
    conversation = LLMChain(llm=llm, prompt=prompt, memory=memory)
    
    # Run conversation - memory is automatically managed
    print("User: I want to book a flight.")
    response1 = conversation.predict(question="I want to book a flight.")
    print(f"Assistant: {response1}\n")
    
    print("User: My name is Sam.")
    response2 = conversation.predict(question="My name is Sam, by the way.")
    print(f"Assistant: {response2}\n")
    
    print("User: What was my name again?")
    response3 = conversation.predict(question="What was my name again?")
    print(f"Assistant: {response3}\n")
    
    print("✅ Memory automatically maintained across conversation turns\n")


# ============================================================================
# Example 3: ConversationBufferMemory with Chat Models
# ============================================================================

def example_conversation_buffer_memory_chat():
    """
    ConversationBufferMemory with Chat Models
    
    ✅ Use when: Working with ChatOpenAI or other chat models
    ✅ Use when: You need structured message objects
    
    Important: Set return_messages=True for chat models!
    """
    print("--- Example 3: ConversationBufferMemory with Chat Models ---")
    
    from langchain.memory import ConversationBufferMemory
    from langchain_openai import ChatOpenAI
    from langchain.chains import LLMChain
    from langchain_core.prompts import (
        ChatPromptTemplate,
        MessagesPlaceholder,
        SystemMessagePromptTemplate,
        HumanMessagePromptTemplate,
    )
    
    setup_environment()
    
    # Define chat model
    llm = ChatOpenAI(model="gpt-4-turbo", temperature=0.7)
    
    # Create chat prompt with MessagesPlaceholder for history
    prompt = ChatPromptTemplate(
        messages=[
            SystemMessagePromptTemplate.from_template(
                "You are a friendly assistant. Remember user details and preferences."
            ),
            MessagesPlaceholder(variable_name="chat_history"),  # History goes here
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    
    # Initialize memory with return_messages=True (REQUIRED for chat models)
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True  # ⚠️ IMPORTANT: True for chat models!
    )
    
    # Build chain
    conversation = LLMChain(llm=llm, prompt=prompt, memory=memory)
    
    # Run conversation
    print("User: Hi, I'm Jane.")
    response1 = conversation.predict(question="Hi, I'm Jane.")
    print(f"Assistant: {response1}\n")
    
    print("User: Do you remember my name?")
    response2 = conversation.predict(question="Do you remember my name?")
    print(f"Assistant: {response2}\n")
    
    # Check what's in memory
    memory_vars = memory.load_memory_variables({})
    print(f"Memory contains {len(memory_vars['chat_history'])} messages")
    print("✅ Chat model with proper message format memory\n")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("LANGCHAIN MEMORY EXAMPLES")
    print("="*70)
    print("\nFor conceptual overview, see: 08_memory_management.py\n")
    
    # Uncomment the examples you want to run:
    
    # example_chat_message_history()
    # example_conversation_buffer_memory()
    # example_conversation_buffer_memory_chat()
    
    print("💡 Tip: Uncomment examples above to see them in action!")
    print("💡 Tip: Check the docstrings for quick reference code snippets!\n")

