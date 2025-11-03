
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import * as z from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const chatgptModel = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0,
});

// Define tools


const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});



// Augment the LLM with tools
const toolsByName = {
  [multiply.name]: multiply,
};
const tools = Object.values(toolsByName);

const chatgptModelWithTools = chatgptModel.bindTools(tools);

// Simple model invocation example
const query = "What is 15 multiplied by 23?";

// Invoke model with tools
const response = await chatgptModelWithTools.invoke([new HumanMessage(query)]);

// console.log("Response:", response);
console.log("Tool calls:", response.tool_calls);

// If model called tools, execute them
if (response.tool_calls && response.tool_calls.length > 0) {
  const toolMessages = [];
  
  for (const toolCall of response.tool_calls) {
    const tool = toolsByName[toolCall.name];
    if (tool) {
      const result = await tool.invoke(toolCall.args);
      toolMessages.push(
        new ToolMessage({
          content: String(result),
          tool_call_id: toolCall.id,
        })
      );
    }
  }
  
  // Send tool results back to model for final response
  const finalResponse = await chatgptModelWithTools.invoke([
    new HumanMessage(query),
    response,
    ...toolMessages,
  ]);
  
  console.log("Final response:", finalResponse.content);
}