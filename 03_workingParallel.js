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

// Parallel state with separate fields for each task
const ParallelState = z.object({
    input: z.string().optional(),
    analysis: z.string().optional(),
    summary: z.string().optional(),
    questions: z.string().optional(),
    final_result: z.string().optional(),
    completed_tasks: z.array(z.string()).default([])
});

// Individual task functions
async function analyzeTask(state) {
    console.log("🔍 Task 1: Analyzing...");
    const prompt = `Analyze this topic and provide detailed insights: ${state.input}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        analysis: response.content,
        completed_tasks: [...state.completed_tasks, 'analysis']
    };
}

async function summarizeTask(state) {
    console.log("📋 Task 2: Summarizing...");
    const prompt = `Create a concise summary of this topic: ${state.input}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        summary: response.content,
        completed_tasks: [...state.completed_tasks, 'summary']
    };
}

async function questionsTask(state) {
    console.log("❓ Task 3: Generating questions...");
    const prompt = `Generate 5 thoughtful questions about this topic: ${state.input}`;
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        questions: response.content,
        completed_tasks: [...state.completed_tasks, 'questions']
    };
}

// Aggregator function
async function aggregateTask(state) {
    console.log("🎯 Aggregating all results...");
    const prompt = `Combine these three analyses into a comprehensive report:
    
    Analysis: ${state.analysis}
    Summary: ${state.summary}
    Questions: ${state.questions}
    
    Create a well-structured final report.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        final_result: response.content
    };
}

// Router function to determine next step
function routeAfterTasks(state) {
    const completed = state.completed_tasks.length;
    console.log(`📊 Completed tasks: ${completed}/3`);
    
    if (completed === 3) {
        return 'aggregate';
    } else {
        return END; // This shouldn't happen in our flow
    }
}

// Create the parallel workflow
const parallelGraph = new StateGraph(ParallelState)
    // Add all nodes
    .addNode('analyze', analyzeTask)
    .addNode('summarize', summarizeTask)
    .addNode('questions', questionsTask)
    .addNode('aggregate', aggregateTask)
    
    // PARALLEL EXECUTION: All three tasks start simultaneously
    .addEdge(START, 'analyze')
    .addEdge(START, 'summarize')
    .addEdge(START, 'questions')
    
    // CONDITIONAL: Wait for all tasks to complete, then aggregate
    .addConditionalEdges(
        'analyze',
        routeAfterTasks,
        {
            'aggregate': 'aggregate',
            END: END
        }
    )
    .addConditionalEdges(
        'summarize',
        routeAfterTasks,
        {
            'aggregate': 'aggregate',
            END: END
        }
    )
    .addConditionalEdges(
        'questions',
        routeAfterTasks,
        {
            'aggregate': 'aggregate',
            END: END
        }
    )
    
    .addEdge('aggregate', END);

const parallelWorkflow = parallelGraph.compile();

// Test the parallel workflow
async function testParallelWorkflow() {
    try {
        console.log("🚀 Starting Parallel Workflow");
        console.log("=" .repeat(50));
        
        const startTime = Date.now();
        
        const result = await parallelWorkflow.invoke({
            input: "The future of artificial intelligence in healthcare"
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log("\n✅ Parallel workflow completed!");
        console.log(`⏱️ Total time: ${duration}ms`);
        
        console.log("\n📊 Results:");
        console.log("=" .repeat(40));
        
        console.log("\n🔍 Analysis:");
        console.log(result.analysis?.substring(0, 200) + "...");
        
        console.log("\n📋 Summary:");
        console.log(result.summary?.substring(0, 200) + "...");
        
        console.log("\n❓ Questions:");
        console.log(result.questions?.substring(0, 200) + "...");
        
        console.log("\n🎯 Final Report:");
        console.log(result.final_result?.substring(0, 300) + "...");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

// Run the test
testParallelWorkflow();

