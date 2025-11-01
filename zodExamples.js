import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// Different ways to define state with Zod

// 1. Simple Zod Schema (like your current one)
const SimpleSchema = z.object({
  messages: z.array(z.any()).default([]),
});

// 2. More specific Zod Schema with proper message types
const DetailedSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    timestamp: z.date().optional(),
  })).default([]),
  conversationId: z.string().optional(),
  step: z.string().default("start"),
});

// 3. Complex Zod Schema with multiple fields
const ComplexSchema = z.object({
  messages: z.array(z.any()).default([]),
  userInfo: z.object({
    name: z.string().optional(),
    id: z.string().optional(),
  }).optional(),
  context: z.object({
    topic: z.string().optional(),
    mood: z.enum(["happy", "sad", "neutral"]).default("neutral"),
  }).optional(),
  metadata: z.record(z.any()).default({}),
});

// Choose which schema to use
const StateSchema = DetailedSchema; // Change this to test different schemas

const model = new ChatOpenAI({
  temperature: 0.4,
  model: "gpt-3.5-turbo",
  apiKey: process.env.OPENAI_API_KEY,
});

async function llmNode(state) {
  console.log("Current state:", JSON.stringify(state, null, 2));
  
  const response = await model.invoke(state.messages);
  
  return {
    messages: [...state.messages, response],
    step: "completed"
  };
}

const graph = new StateGraph(StateSchema)
  .addNode('llm', llmNode)
  .addEdge(START, 'llm')
  .addEdge('llm', END)
  .compile();

// Test with different schemas
async function testSchemas() {
  console.log("🧪 Testing Zod Schemas in LangGraph\n");
  
  try {
    // Test 1: Simple schema
    console.log("1️⃣ Testing Simple Schema:");
    const simpleGraph = new StateGraph(SimpleSchema)
      .addNode('llm', llmNode)
      .addEdge(START, 'llm')
      .addEdge('llm', END)
      .compile();
    
    const result1 = await simpleGraph.invoke({
      messages: [new HumanMessage("Hello!")]
    });
    console.log("✅ Simple schema result:", result1.messages.length, "messages\n");
    
    // Test 2: Detailed schema
    console.log("2️⃣ Testing Detailed Schema:");
    const detailedGraph = new StateGraph(DetailedSchema)
      .addNode('llm', llmNode)
      .addEdge(START, 'llm')
      .addEdge('llm', END)
      .compile();
    
    const result2 = await detailedGraph.invoke({
      messages: [{ role: "user", content: "Hi there!" }],
      conversationId: "conv-123",
      step: "greeting"
    });
    console.log("✅ Detailed schema result:", result2.step, "\n");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run the test
testSchemas();
