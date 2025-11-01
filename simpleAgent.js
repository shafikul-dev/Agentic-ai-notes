import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, END, START  } from "@langchain/langgraph";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();



//init model

const llm = new ChatOpenAI({
    model: "gpt-4o-mini", // or gpt-4o
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY,
  });


// 1️⃣ Define the shape of your state
const schema=z.object({
    message:z.string(),
    llmOutput:z.string().optional()
})


  //graph setup
  const graph =new StateGraph(schema)
  .addNode('userInput',async()=>{
    return { message:"hello i am shaikul"}
  })
  .addNode('callLLM',async(state)=>{
   const res=await llm.invoke(state.message);
   return{...state,llmOutput:res.content}


  })
  .addNode('summarize',async(state)=>{
    console.log("LLM output:",state.llmOutput)
    return state
  })

  .addEdge(START,"userInput")

  .addEdge("userInput", "callLLM")
  .addEdge("callLLM", "summarize")
  .addEdge("summarize", END);
  

 
  
  
  
  const app = graph.compile();
  await app.invoke({message:"I am shafikul and you"});