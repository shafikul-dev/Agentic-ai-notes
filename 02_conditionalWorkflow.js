import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatOpenAI({
    temperature: 0.7,
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
});

// State for conditional agentic workflow
const AgenticState = z.object({
    user_query: z.string().optional(),
    query_type: z.string().optional(),
    confidence_score: z.number().optional(),
    analysis_result: z.string().optional(),
    action_taken: z.string().optional(),
    final_response: z.string().optional(),
    reasoning: z.string().optional()
});

// Agentic decision-making functions
async function analyzeQuery(state) {
    console.log("🧠 Agent: Analyzing user query...");
    
    const prompt = `Analyze this user query and determine:
    1. What type of request this is (question, task, creative, technical, etc.)
    2. Your confidence level (0-10) in understanding the request
    3. What action should be taken
    
    User Query: "${state.user_query}"
    
    Respond in this JSON format:
    {
        "query_type": "type of request",
        "confidence_score": number,
        "reasoning": "why you classified it this way"
    }`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    try {
        const analysis = JSON.parse(response.content);
        return {
            ...state,
            query_type: analysis.query_type,
            confidence_score: analysis.confidence_score,
            reasoning: analysis.reasoning,
            analysis_result: response.content
        };
    } catch (error) {
        return {
            ...state,
            query_type: "unknown",
            confidence_score: 5,
            reasoning: "Failed to parse analysis",
            analysis_result: response.content
        };
    }
}

async function handleTechnicalQuery(state) {
    console.log("🔧 Agent: Handling technical query...");
    
    const prompt = `You are a technical expert. Provide a detailed, technical response to this query:
    
    Query: "${state.user_query}"
    Query Type: "${state.query_type}"
    
    Provide a comprehensive technical answer with examples, best practices, and implementation details.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        action_taken: "technical_analysis",
        final_response: response.content
    };
}

async function handleCreativeQuery(state) {
    console.log("🎨 Agent: Handling creative query...");
    
    const prompt = `You are a creative assistant. Provide an imaginative and creative response to this query:
    
    Query: "${state.user_query}"
    Query Type: "${state.query_type}"
    
    Be creative, engaging, and provide unique perspectives or solutions.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        action_taken: "creative_response",
        final_response: response.content
    };
}

async function handleGeneralQuery(state) {
    console.log("💬 Agent: Handling general query...");
    
    const prompt = `You are a helpful assistant. Provide a clear, informative response to this query:
    
    Query: "${state.user_query}"
    Query Type: "${state.query_type}"
    
    Provide a helpful, accurate, and well-structured response.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        action_taken: "general_response",
        final_response: response.content
    };
}

async function requestClarification(state) {
    console.log("❓ Agent: Requesting clarification...");
    
    const prompt = `The user's query is unclear or you have low confidence. Ask for clarification:
    
    Original Query: "${state.user_query}"
    Confidence Score: ${state.confidence_score}
    Reasoning: "${state.reasoning}"
    
    Ask 2-3 specific questions to help clarify what the user really wants.`;
    
    const response = await model.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        action_taken: "clarification_request",
        final_response: response.content
    };
}

// Conditional routing function - the "brain" of the agent
function routeQuery(state) {
    console.log(`🤖 Agent Decision: Query type="${state.query_type}", Confidence=${state.confidence_score}`);
    
    // Low confidence - ask for clarification
    if (state.confidence_score < 4) {
        console.log("→ Routing to clarification");
        return 'clarification';
    }
    
    // High confidence - route based on query type
    const queryType = state.query_type?.toLowerCase() || '';
    
    if (queryType.includes('technical') || queryType.includes('code') || queryType.includes('programming')) {
        console.log("→ Routing to technical handler");
        return 'technical';
    } else if (queryType.includes('creative') || queryType.includes('story') || queryType.includes('art')) {
        console.log("→ Routing to creative handler");
        return 'creative';
    } else {
        console.log("→ Routing to general handler");
        return 'general';
    }
}

// Create the agentic conditional workflow
const agenticGraph = new StateGraph(AgenticState)
    // Add all nodes
    .addNode('analyze', analyzeQuery)
    .addNode('technical', handleTechnicalQuery)
    .addNode('creative', handleCreativeQuery)
    .addNode('general', handleGeneralQuery)
    .addNode('clarification', requestClarification)
    
    // Start with analysis
    .addEdge(START, 'analyze')
    
    // Conditional routing based on analysis
    .addConditionalEdges(
        'analyze',
        routeQuery,
        {
            'technical': 'technical',
            'creative': 'creative',
            'general': 'general',
            'clarification': 'clarification'
        }
    )
    
    // All paths lead to END
    .addEdge('technical', END)
    .addEdge('creative', END)
    .addEdge('general', END)
    .addEdge('clarification', END);

const agenticWorkflow = agenticGraph.compile();

// Test function with different types of queries
async function testAgenticWorkflow() {
    const testQueries = [
        "How do I implement a binary search tree in Python?",
        "Write a creative story about a robot learning to paint",
        "What's the weather like today?",
        "asdf qwerty random text"
    ];
    
    for (const query of testQueries) {
        try {
            console.log("\n" + "=".repeat(60));
            console.log(`🚀 Testing Agentic AI with: "${query}"`);
            console.log("=".repeat(60));
            
            const startTime = Date.now();
            
            const result = await agenticWorkflow.invoke({
                user_query: query
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log("\n📊 Agent Analysis:");
            console.log(`Query Type: ${result.query_type}`);
            console.log(`Confidence: ${result.confidence_score}/10`);
            console.log(`Action Taken: ${result.action_taken}`);
            console.log(`Reasoning: ${result.reasoning}`);
            
            console.log("\n🤖 Agent Response:");
            console.log(result.final_response);
            
            console.log(`\n⏱️ Processing time: ${duration}ms`);
            
        } catch (error) {
            console.error("❌ Error:", error.message);
        }
    }
}

// Run the agentic workflow test
testAgenticWorkflow();