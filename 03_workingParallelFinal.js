import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatOpenAI({
    temperature: 0.4,
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
});

// State for parallel processing
const ParallelState = z.object({
    topic: z.string().optional(),
    research_result: z.string().optional(),
    outline_result: z.string().optional(),
    keywords_result: z.string().optional(),
    final_blog: z.string().optional()
});

// Parallel task functions - each reads topic independently
async function researchTask(state) {
    console.log("🔍 Research task starting...");
    const topic = state.topic;
    const prompt = `Research key facts and statistics about: ${topic}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        research_result: response.content
    };
}

async function outlineTask(state) {
    console.log("📋 Outline task starting...");
    const topic = state.topic;
    const prompt = `Create a detailed blog outline for: ${topic}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        outline_result: response.content
    };
}

async function keywordsTask(state) {
    console.log("🔑 Keywords task starting...");
    const topic = state.topic;
    const prompt = `Generate SEO keywords and meta description for: ${topic}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        keywords_result: response.content
    };
}

// Final aggregation
async function createBlog(state) {
    console.log("✍️ Creating final blog...");
    const prompt = `Write a complete blog post about: ${state.topic}
    
    Use this research: ${state.research_result}
    Follow this outline: ${state.outline_result}
    Include these keywords: ${state.keywords_result}
    
    Create a comprehensive, engaging blog post.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        final_blog: response.content
    };
}

// Create parallel workflow
const parallelGraph = new StateGraph(ParallelState)
    // Add nodes
    .addNode('researchTask', researchTask)
    .addNode('outlineTask', outlineTask)
    .addNode('keywordsTask', keywordsTask)
    .addNode('createBlog', createBlog)
    
    // PARALLEL EXECUTION: All three tasks run simultaneously
    .addEdge(START, 'researchTask')
    .addEdge(START, 'outlineTask')
    .addEdge(START, 'keywordsTask')
    
    // All parallel tasks feed into the final blog creation
    .addEdge('researchTask', 'createBlog')
    .addEdge('outlineTask', 'createBlog')
    .addEdge('keywordsTask', 'createBlog')
    .addEdge('createBlog', END);

const parallelWorkflow = parallelGraph.compile();

// Test function
async function testParallel() {
    try {
        console.log("🚀 Starting Parallel Blog Creation");
        console.log("=" .repeat(50));
        
        const startTime = Date.now();
        
        const result = await parallelWorkflow.invoke({
            topic: "Machine Learning in Finance"
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log("\n✅ Parallel workflow completed!");
        console.log(`⏱️ Total time: ${duration}ms`);
        
        console.log("\n📊 Results:");
        console.log("=" .repeat(40));
        
        console.log("\n🔍 Research:");
        console.log(result.research_result?.substring(0, 150) + "...");
        
        console.log("\n📋 Outline:");
        console.log(result.outline_result?.substring(0, 150) + "...");
        
        console.log("\n🔑 Keywords:");
        console.log(result.keywords_result?.substring(0, 150) + "...");
        
        console.log("\n✍️ Final Blog:");
        console.log(result.final_blog?.substring(0, 300) + "...");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run the test
testParallel();

