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

// Define state schema for parallel workflow
const ParallelStateSchema = z.object({
    topic: z.string().optional(),
    research: z.string().optional(),
    outline: z.string().optional(),
    content: z.string().optional(),
    images: z.string().optional(),
    seo: z.string().optional(),
    final_result: z.string().optional()
});

// Parallel Node Functions
async function researchNode(state) {
    console.log("🔍 Starting research...");
    const topic = state.topic;
    const prompt = `Research and gather key information about: ${topic}. Provide facts, statistics, and important details.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        research: response.content
    };
}

async function outlineNode(state) {
    console.log("📋 Creating outline...");
    const topic = state.topic;
    const prompt = `Create a detailed outline for a blog post about: ${topic}. Include main sections and subsections.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        outline: response.content
    };
}

async function imageIdeasNode(state) {
    console.log("🖼️ Generating image ideas...");
    const topic = state.topic;
    const prompt = `Suggest 5 visual ideas and image concepts for a blog post about: ${topic}. Be creative and specific.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        images: response.content
    };
}

async function seoNode(state) {
    console.log("🔍 Optimizing for SEO...");
    const topic = state.topic;
    const prompt = `Generate SEO keywords, meta description, and title suggestions for a blog post about: ${topic}.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        seo: response.content
    };
}

// Sequential Node Functions
async function contentNode(state) {
    console.log("✍️ Writing content...");
    const topic = state.topic;
    const research = state.research;
    const outline = state.outline;
    
    const prompt = `Write comprehensive blog content about: ${topic}. 
    Use this research: ${research}
    Follow this outline: ${outline}
    Make it engaging and informative.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        content: response.content
    };
}

async function finalizeNode(state) {
    console.log("🎯 Finalizing blog post...");
    const content = state.content;
    const images = state.images;
    const seo = state.seo;
    
    const prompt = `Create a final blog post by combining:
    Content: ${content}
    Image suggestions: ${images}
    SEO optimization: ${seo}
    
    Format it as a complete, publishable blog post.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        final_result: response.content
    };
}

// Create Parallel Workflow
const parallelGraph = new StateGraph(ParallelStateSchema)
    // Sequential start
    .addNode('research', researchNode)
    .addNode('outline', outlineNode)
    .addNode('imageIdeas', imageIdeasNode)
    .addNode('seo', seoNode)
    
    // Parallel execution - all these nodes run simultaneously
    .addEdge(START, 'research')
    .addEdge(START, 'outline')
    .addEdge(START, 'imageIdeas')
    .addEdge(START, 'seo')
    
    // Sequential after parallel
    .addNode('content', contentNode)
    .addNode('finalize', finalizeNode)
    
    // Connect parallel results to sequential
    .addEdge('research', 'content')
    .addEdge('outline', 'content')
    .addEdge('imageIdeas', 'finalize')
    .addEdge('seo', 'finalize')
    .addEdge('content', 'finalize')
    .addEdge('finalize', END);

const parallelWorkflow = parallelGraph.compile();

// Test the parallel workflow
async function testParallelWorkflow() {
    try {
        console.log("🚀 Starting Parallel Blog Creation Workflow");
        console.log("=" .repeat(60));
        
        const startTime = Date.now();
        
        const result = await parallelWorkflow.invoke({
            topic: "Artificial Intelligence in Healthcare"
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log("\n✅ Workflow completed!");
        console.log(`⏱️ Total time: ${duration}ms`);
        
        console.log("\n📊 Results:");
        console.log("=" .repeat(40));
        console.log("\n🔍 Research:");
        console.log(result.research?.substring(0, 200) + "...");
        
        console.log("\n📋 Outline:");
        console.log(result.outline?.substring(0, 200) + "...");
        
        console.log("\n🖼️ Image Ideas:");
        console.log(result.images?.substring(0, 200) + "...");
        
        console.log("\n🔍 SEO:");
        console.log(result.seo?.substring(0, 200) + "...");
        
        console.log("\n✍️ Content:");
        console.log(result.content?.substring(0, 200) + "...");
        
        console.log("\n🎯 Final Result:");
        console.log(result.final_result?.substring(0, 300) + "...");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run the test
testParallelWorkflow();