
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

// Define API request tool
const getTaskPrioritizationData = tool(
  async () => {
    const url = "https://ai-powered-task-prioritization-app-nine.vercel.app/";
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
      
      // Try to parse as JSON, fallback to text if not JSON
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return JSON.stringify(data);
    } catch (error) {
      return `Error fetching data: ${error.message}`;
    }
  },
  {
    name: "get_task_prioritization_data",
    description: "Make a GET request to the AI-powered task prioritization app API endpoint to retrieve data",
    schema: z.object({}),
  }
);

// Augment the LLM with tools
const toolsByName = {
  [getTaskPrioritizationData.name]: getTaskPrioritizationData,
};
const tools = Object.values(toolsByName);

const chatgptModelWithTools = chatgptModel.bindTools(tools);

// Query to test the API request tool
const query = "Can you fetch data from the task prioritization app API?";

// Invoke model with tools
const response = await chatgptModelWithTools.invoke([new HumanMessage(query)]);

console.log("Tool calls:", response.tool_calls);

// If model called tools, execute them
if (response.tool_calls && response.tool_calls.length > 0) {
  const toolMessages = [];
  
  for (const toolCall of response.tool_calls) {
    const tool = toolsByName[toolCall.name];
    console.log("shafikul checking",tool)
    if (tool) {
      const result = await tool.invoke(toolCall.args);
      
      console.log("shafikul tool call results",result)
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
} else {
  console.log("No tool calls made. Response:", response.content);
}

