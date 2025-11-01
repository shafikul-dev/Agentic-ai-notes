import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define state with Zod (instead of Annotation)
const StateSchema = z.object({
  messages: z.array(z.any()).default([]),
});

const model = new ChatOpenAI({
    temperature: 0.4,
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
});

// Create a proper node function
async function llmNode(state) {
  const response = await model.invoke(state.messages);
  return {
    messages: [...state.messages, response]
  };
}

const graph = new StateGraph(StateSchema)
  .addNode('llm', llmNode)
  .addEdge(START, 'llm')
  .addEdge('llm', END)
  .compile();

// Use proper message format
const result = await graph.invoke({
  messages: [new HumanMessage("hi!")]
});

console.log("Response:", result.messages[result.messages.length - 1].content);

