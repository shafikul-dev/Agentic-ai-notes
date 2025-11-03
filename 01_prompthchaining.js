import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END, Graph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const model = new ChatOpenAI({
    temperature: 0.4,
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
});




const StateSchema = z.object({

    title:z.string().optional(),
    outline:z.string().optional(),
    content:z.string().optional()

});


//define nodes 
function  llmNode(content){
    
    model.invoke(content)

}

async function create_outline(state){
    const title = state.title;
    const prompt = `Generate a detailed outline for a blog on the topic - ${title}`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    const outline = response.content;
    
    return {
        ...state,
        outline: outline
    };
}

async function create_blog(state){
    const title = state.title;
    const outline = state.outline;
    const prompt = `Generate detailed content for a blog on the topic - ${title}. Use this outline: ${outline}`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    const content = response.content;
    
    return {
        ...state,
        content: content
    };
}



//workflow stats here

const graph=new StateGraph(StateSchema)
.addNode('create_blog',create_blog)
.addNode('create_outline',create_outline)
.addEdge(START,'create_blog')
.addEdge('create_blog','create_outline')
.addEdge('create_outline',END)

const workflow = graph.compile();

// Test the workflow
async function testWorkflow() {
    try {
        console.log("🚀 Starting Blog Creation Workflow");
        
        const result = await workflow.invoke({
            title: "Introduction to LangGraph"
        });
        
        console.log("\n📝 Blog Title:", result.title);
        console.log("\n📋 Outline:");
        console.log(result.outline);
        console.log("\n📄 Content:");
        console.log(result.content);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

testWorkflow();