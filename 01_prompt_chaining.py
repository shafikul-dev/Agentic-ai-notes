import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
# For better security, load environment variables from a .env file
from dotenv import load_dotenv

load_dotenv()
# Make sure your OPENAI_API_KEY is set in the .env file
# Initialize the Language Model (using ChatOpenAI is recommended)
llm = ChatOpenAI(temperature=0)

# --- Debug Function ---
def debug_step(step_name):
    """Helper function to print intermediate results in the chain"""
    def _debug(x):
        print(f"\n{'='*60}")
        print(f"🔍 DEBUG: {step_name}")
        print(f"{'='*60}")
        print(f"Type: {type(x)}")
        print(f"Content:\n{x}")
        print(f"{'='*60}\n")
        return x
    return _debug

# --- Prompt 1: Extract Information ---
prompt_extract = ChatPromptTemplate.from_template(
    "Extract the technical specifications from the following text:\n\n{text_input}"
)

# --- Prompt 2: Transform to JSON ---
prompt_transform = ChatPromptTemplate.from_template(
    "Transform the following specifications into a JSON object with 'cpu', 'memory', and 'storage' as keys:\n\n{specifications}"
)

# --- Build the Chain using LCEL ---
# The StrOutputParser() converts the LLM's message output to a simple string.
extraction_chain = (
    prompt_extract 
    | llm 
    | StrOutputParser()
    | RunnablePassthrough(debug_step("After Extraction (Step 1)"))
)

# The full chain passes the output of the extraction chain into the 'specifications'
# variable for the transformation prompt.
full_chain = (
    {"specifications": extraction_chain} 
    | RunnablePassthrough(debug_step("After Dictionary Wrapping"))
    | prompt_transform 
    | RunnablePassthrough(debug_step("After Prompt 2 Template"))
    | llm 
    | StrOutputParser()
)

# --- Run the Chain ---
input_text = "The new laptop model features a 3.5 GHz octa-core processor, 16GB of RAM, and a 1TB NVMe SSD."

print("\n" + "="*60)
print("🚀 STARTING PROMPT CHAIN EXECUTION")
print("="*60)
print(f"📥 INPUT TEXT:\n{input_text}")
print("="*60)

# Execute the chain with the input text dictionary.
final_result = full_chain.invoke({"text_input": input_text})

print("\n" + "="*60)
print("✅ FINAL JSON OUTPUT")
print("="*60)
print(final_result)
print("="*60)

