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

// Simple parallel state - each task gets its own field
const SimpleParallelState = z.object({
    input: z.string().optional(),
    task1_result: z.string().optional(),
    task2_result: z.string().optional(),
    task3_result: z.string().optional(),
    final_result: z.string().optional()
});

// Parallel task functions
async function task1(state) {
    console.log("🔄 Task 1: Analyzing input...");
    const prompt = `Analyze this input and provide insights: ${state.input}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        task1_result: response.content
    };
}

async function task2(state) {
    console.log("🔄 Task 2: Generating summary...");
    const prompt = `Summarize this input in 3 key points: ${state.input}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        task2_result: response.content
    };
}

async function task3(state) {
    console.log("🔄 Task 3: Creating questions...");
    const prompt = `Generate 5 questions about this topic: ${state.input}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        task3_result: response.content
    };
}

// Final aggregation function
async function aggregateResults(state) {
    console.log("🎯 Aggregating results...");
    const prompt = `Combine these results into a comprehensive analysis:
    
    Task 1 (Analysis): ${state.task1_result}
    Task 2 (Summary): ${state.task2_result}
    Task 3 (Questions): ${state.task3_result}
    
    Create a final comprehensive report.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        final_result: response.content
    };
}

// Create parallel workflow
const simpleParallelGraph = new StateGraph(SimpleParallelState)
    // Add all nodes
    .addNode('task1', task1)
    .addNode('task2', task2)
    .addNode('task3', task3)
    .addNode('aggregate', aggregateResults)
    
    // PARALLEL EXECUTION: All tasks start from START simultaneously
    .addEdge(START, 'task1')
    .addEdge(START, 'task2')
    .addEdge(START, 'task3')
    
    // SEQUENTIAL: All tasks feed into aggregation
    .addEdge('task1', 'aggregate')
    .addEdge('task2', 'aggregate')
    .addEdge('task3', 'aggregate')
    .addEdge('aggregate', END);

const simpleParallelWorkflow = simpleParallelGraph.compile();

// Test function
async function testSimpleParallel() {
    try {
        console.log("🚀 Starting Simple Parallel Workflow");
        console.log("=" .repeat(50));
        
        const startTime = Date.now();
        
        const result = await simpleParallelWorkflow.invoke({
            input: "The impact of artificial intelligence on modern software development"
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log("\n✅ Parallel workflow completed!");
        console.log(`⏱️ Total time: ${duration}ms`);
        
        console.log("\n📊 Results:");
        console.log("=" .repeat(30));
        console.log("\n🔍 Task 1 Analysis:");
        console.log(result.task1_result);
        
        console.log("\n📋 Task 2 Summary:");
        console.log(result.task2_result);
        
        console.log("\n❓ Task 3 Questions:");
        console.log(result.task3_result);
        
        console.log("\n🎯 Final Aggregated Result:");
        console.log(result.final_result);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run the test
testSimpleParallel();
