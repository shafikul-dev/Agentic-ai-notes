import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// 🌟 REAL PROJECT EXAMPLE: Customer Support Agent
// This shows how to use agentic workflows in a real business application

const llm = new ChatOpenAI({
    temperature: 0.3, // Lower temperature for more consistent business responses
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
});

// Business State Definition
const CustomerSupportState = z.object({
    // Customer data
    customer_message: z.string(),
    customer_id: z.string().optional(),
    customer_tier: z.string().optional(), // premium, standard, basic
    
    // Processing
    issue_category: z.string().optional(), // billing, technical, general
    priority_level: z.string().optional(), // high, medium, low
    sentiment: z.string().optional(), // positive, neutral, negative
    
    // Response
    suggested_solution: z.string().optional(),
    response_tone: z.string().optional(), // professional, friendly, urgent
    final_response: z.string().optional(),
    
    // Tracking
    processing_time: z.number().optional(),
    requires_human: z.boolean().default(false)
});

// Business Logic Functions
async function categorizeIssue(state) {
    console.log("📋 Categorizing customer issue...");
    
    const prompt = `Categorize this customer support message:
    
    Message: "${state.customer_message}"
    
    Determine:
    1. Issue category (billing, technical, general, complaint, feature_request)
    2. Priority level (high, medium, low)
    3. Customer sentiment (positive, neutral, negative)
    4. Whether this requires human intervention (true/false)
    
    Respond in JSON format:
    {
        "category": "category_name",
        "priority": "priority_level",
        "sentiment": "sentiment_level",
        "requires_human": boolean
    }`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    try {
        const analysis = JSON.parse(response.content);
        return {
            ...state,
            issue_category: analysis.category,
            priority_level: analysis.priority,
            sentiment: analysis.sentiment,
            requires_human: analysis.requires_human
        };
    } catch (error) {
        // Fallback if JSON parsing fails
        return {
            ...state,
            issue_category: "general",
            priority_level: "medium",
            sentiment: "neutral",
            requires_human: false
        };
    }
}

async function generateSolution(state) {
    console.log("💡 Generating solution...");
    
    const prompt = `Generate a solution for this customer support issue:
    
    Customer Message: "${state.customer_message}"
    Issue Category: "${state.issue_category}"
    Priority: "${state.priority_level}"
    Sentiment: "${state.sentiment}"
    
    Provide:
    1. A clear solution or next steps
    2. Appropriate tone (professional, friendly, urgent)
    3. Any additional resources or links
    
    Make it helpful and actionable.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        suggested_solution: response.content
    };
}

async function personalizeResponse(state) {
    console.log("👤 Personalizing response...");
    
    const prompt = `Create a personalized customer support response:
    
    Customer Message: "${state.customer_message}"
    Solution: "${state.suggested_solution}"
    Customer Tier: "${state.customer_tier || 'standard'}"
    Sentiment: "${state.sentiment}"
    
    Create a response that:
    1. Addresses the customer's specific issue
    2. Uses appropriate tone for their sentiment
    3. Provides clear next steps
    4. Includes relevant resources
    5. Shows empathy and understanding
    
    Keep it professional but warm.`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        final_response: response.content
    };
}

async function escalateToHuman(state) {
    console.log("👨‍💼 Escalating to human agent...");
    
    const escalationNote = `Customer issue escalated to human agent.
    
    Customer Message: "${state.customer_message}"
    Issue Category: "${state.issue_category}"
    Priority: "${state.priority_level}"
    Sentiment: "${state.sentiment}"
    
    AI Analysis: This issue requires human intervention due to complexity or customer request.`;
    
    return {
        ...state,
        final_response: escalationNote,
        requires_human: true
    };
}

// Routing Logic
function routeCustomerIssue(state) {
    console.log(`🤖 Routing decision: Category="${state.issue_category}", Human="${state.requires_human}"`);
    
    if (state.requires_human) {
        return 'escalate';
    } else {
        return 'solve';
    }
}

// Build the Customer Support Workflow
const customerSupportWorkflow = new StateGraph(CustomerSupportState)
    // Add all nodes
    .addNode('categorize', categorizeIssue)
    .addNode('solve', generateSolution)
    .addNode('personalize', personalizeResponse)
    .addNode('escalate', escalateToHuman)
    
    // Define flow
    .addEdge(START, 'categorize')
    
    // Conditional routing based on analysis
    .addConditionalEdges(
        'categorize',
        routeCustomerIssue,
        {
            'solve': 'solve',
            'escalate': 'escalate'
        }
    )
    
    // Continue flow for automated responses
    .addEdge('solve', 'personalize')
    .addEdge('personalize', END)
    .addEdge('escalate', END);

const compiledSupportAgent = customerSupportWorkflow.compile();

// Test with different customer scenarios
async function testCustomerSupportAgent() {
    const testCases = [
        {
            customer_message: "I can't log into my account. I've tried resetting my password but it's not working.",
            customer_tier: "premium"
        },
        {
            customer_message: "Your service is terrible! I want a refund immediately!",
            customer_tier: "standard"
        },
        {
            customer_message: "I love your product! Can you add a dark mode feature?",
            customer_tier: "basic"
        },
        {
            customer_message: "I need help with my billing. There's a charge I don't recognize.",
            customer_tier: "premium"
        }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log("\n" + "=".repeat(60));
            console.log(`🚀 Testing: "${testCase.customer_message}"`);
            console.log("=".repeat(60));
            
            const startTime = Date.now();
            
            const result = await compiledSupportAgent.invoke({
                customer_message: testCase.customer_message,
                customer_tier: testCase.customer_tier
            });
            
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            
            console.log("\n📊 Agent Analysis:");
            console.log(`Issue Category: ${result.issue_category}`);
            console.log(`Priority: ${result.priority_level}`);
            console.log(`Sentiment: ${result.sentiment}`);
            console.log(`Requires Human: ${result.requires_human}`);
            
            console.log("\n💬 Final Response:");
            console.log(result.final_response);
            
            console.log(`\n⏱️ Processing time: ${processingTime}ms`);
            
        } catch (error) {
            console.error("❌ Error:", error.message);
        }
    }
}

// Run the test
testCustomerSupportAgent();

// 🎯 HOW TO USE THIS IN YOUR PROJECT:

// 1. Import the compiled agent
export { compiledSupportAgent };

// 2. Use in your API endpoint
/*
app.post('/api/support', async (req, res) => {
    try {
        const result = await compiledSupportAgent.invoke({
            customer_message: req.body.message,
            customer_tier: req.body.tier
        });
        
        res.json({
            response: result.final_response,
            requires_human: result.requires_human,
            category: result.issue_category
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
*/

// 3. Use in your frontend
/*
const handleSupportMessage = async (message) => {
    const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: message,
            tier: userTier 
        })
    });
    
    const data = await response.json();
    return data.response;
};
*/

