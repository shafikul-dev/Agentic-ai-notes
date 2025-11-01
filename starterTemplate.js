import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// 🚀 STARTER TEMPLATE FOR JUNIOR DEVELOPERS
// Copy this template and modify it for your project!

const llm = new ChatOpenAI({
    temperature: 0.7,
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
});

// 📝 STEP 1: Define your state (what data your agent will work with)
const MyAgentState = z.object({
    // Input from user
    user_input: z.string().optional(),
    
    // Processing steps
    analysis: z.string().optional(),
    decision: z.string().optional(),
    
    // Output
    response: z.string().optional(),
    
    // Optional: tracking
    confidence: z.number().optional(),
    step_count: z.number().default(0)
});

// 📝 STEP 2: Create your node functions (what your agent does)
async function analyzeInput(state) {
    console.log("🔍 Analyzing input...");
    
    const prompt = `Analyze this user input and provide insights:
    Input: "${state.user_input}"
    
    Respond with:
    1. What type of request this is
    2. Key points to address
    3. Suggested approach`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        analysis: response.content,
        step_count: state.step_count + 1
    };
}

async function makeDecision(state) {
    console.log("🤔 Making decision...");
    
    const prompt = `Based on this analysis, decide what to do:
    Analysis: "${state.analysis}"
    
    Choose the best approach and explain why.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        decision: response.content,
        step_count: state.step_count + 1
    };
}

async function generateResponse(state) {
    console.log("💬 Generating response...");
    
    const prompt = `Create a helpful response based on:
    Original input: "${state.user_input}"
    Analysis: "${state.analysis}"
    Decision: "${state.decision}"
    
    Provide a clear, helpful response.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        response: response.content,
        step_count: state.step_count + 1
    };
}

// 📝 STEP 3: Build your workflow (how your agent flows)
const myAgentWorkflow = new StateGraph(MyAgentState)
    // Add your nodes
    .addNode('analyze', analyzeInput)
    .addNode('decide', makeDecision)
    .addNode('respond', generateResponse)
    
    // Define the flow
    .addEdge(START, 'analyze')
    .addEdge('analyze', 'decide')
    .addEdge('decide', 'respond')
    .addEdge('respond', END);

// 📝 STEP 4: Compile and test
const compiledAgent = myAgentWorkflow.compile();

// Test function
async function testMyAgent() {
    try {
        console.log("🚀 Testing My Agent");
        console.log("=" .repeat(40));
        
        const result = await compiledAgent.invoke({
            user_input: "I want to learn Python programming"
        });
        
        console.log("\n📊 Agent Results:");
        console.log("Analysis:", result.analysis);
        console.log("Decision:", result.decision);
        console.log("Response:", result.response);
        console.log("Steps taken:", result.step_count);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run the test
testMyAgent();

// 🎯 ADVANCED PATTERNS YOU CAN ADD:

// Pattern 1: Conditional Routing
function routeBasedOnAnalysis(state) {
    const analysis = state.analysis?.toLowerCase() || '';
    
    if (analysis.includes('technical')) {
        return 'technical_handler';
    } else if (analysis.includes('creative')) {
        return 'creative_handler';
    } else {
        return 'general_handler';
    }
}

// Pattern 2: Parallel Processing
async function parallelTask1(state) {
    // Task 1 runs in parallel
    return { ...state, task1_result: "done" };
}

async function parallelTask2(state) {
    // Task 2 runs in parallel
    return { ...state, task2_result: "done" };
}

// Pattern 3: Error Handling
async function safeNodeFunction(state) {
    try {
        const result = await riskyOperation(state);
        return { ...state, result };
    } catch (error) {
        console.error('Error:', error.message);
        return { ...state, error: error.message };
    }
}

// Pattern 4: Validation
function validateResult(state) {
    if (state.confidence && state.confidence < 5) {
        return 'improve';  // Try again
    }
    return 'finalize';     // Good enough
}

// 🎉 EXPORT FOR USE IN OTHER FILES
export { compiledAgent, MyAgentState };

