import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, START, END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

// 🎯 HANDS-ON EXAMPLE: Building Your First Agentic AI
// Follow this step-by-step to build a simple but smart agent

const llm = new ChatOpenAI({
    temperature: 0.7,
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
});

// 📝 STEP 1: Define Your Agent's Purpose
// "I want an agent that helps people choose the right programming language to learn"

// 📝 STEP 2: Design the User Journey
/*
User Journey:
1. User asks: "What programming language should I learn?"
2. Agent asks: "What do you want to build?"
3. User answers: "Web applications"
4. Agent asks: "What's your experience level?"
5. User answers: "Beginner"
6. Agent recommends: "Start with JavaScript"
7. Agent explains why and provides next steps
*/

// 📝 STEP 3: Define the State (Agent's Memory)
const LanguageRecommendationState = z.object({
    // User input
    user_goal: z.string().optional(),           // What they want to build
    experience_level: z.string().optional(),   // Beginner, Intermediate, Advanced
    interests: z.string().optional(),          // Web, Mobile, Data Science, etc.
    
    // Agent processing
    analysis: z.string().optional(),           // Agent's analysis of user needs
    recommendation: z.string().optional(),    // Recommended language
    reasoning: z.string().optional(),          // Why this recommendation
    
    // Output
    next_steps: z.string().optional(),         // What to do next
    resources: z.string().optional(),          // Learning resources
});

// 📝 STEP 4: Create Node Functions (What the Agent Does)

// Node 1: Analyze User's Goals
async function analyzeGoals(state) {
    console.log("🔍 Agent: Analyzing user's goals...");
    
    const prompt = `Analyze this user's programming goals and provide insights:
    
    User Goal: "${state.user_goal || 'Not specified'}"
    Experience Level: "${state.experience_level || 'Not specified'}"
    Interests: "${state.interests || 'Not specified'}"
    
    Provide:
    1. What type of projects they're likely to build
    2. Key considerations for their skill level
    3. Important factors for their interests
    
    Be helpful and encouraging!`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        analysis: response.content
    };
}

// Node 2: Make Recommendation
async function makeRecommendation(state) {
    console.log("💡 Agent: Making language recommendation...");
    
    const prompt = `Based on this analysis, recommend the best programming language:
    
    Analysis: "${state.analysis}"
    User Goal: "${state.user_goal}"
    Experience Level: "${state.experience_level}"
    Interests: "${state.interests}"
    
    Recommend ONE programming language and explain:
    1. Why this language is perfect for them
    2. What they can build with it
    3. How it matches their skill level
    4. Career opportunities
    
    Be specific and encouraging!`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        recommendation: response.content
    };
}

// Node 3: Provide Next Steps
async function provideNextSteps(state) {
    console.log("🚀 Agent: Providing next steps...");
    
    const prompt = `Create a learning plan for this user:
    
    Recommendation: "${state.recommendation}"
    Experience Level: "${state.experience_level}"
    
    Provide:
    1. First 3 things they should learn
    2. Recommended learning resources (free options)
    3. First project they should build
    4. Timeline for getting started
    5. How to stay motivated
    
    Make it actionable and encouraging!`;
    
    const response = await llm.invoke([new HumanMessage(prompt)]);
    
    return {
        ...state,
        next_steps: response.content,
        resources: "Free resources: Codecademy, freeCodeCamp, YouTube tutorials, official documentation"
    };
}

// 📝 STEP 5: Build the Workflow (How the Agent Flows)
const languageRecommendationAgent = new StateGraph(LanguageRecommendationState)
    // Add all the nodes
    .addNode('analyzeGoals', analyzeGoals)
    .addNode('makeRecommendation', makeRecommendation)
    .addNode('provideNextSteps', provideNextSteps)
    
    // Define the flow (sequential workflow)
    .addEdge(START, 'analyzeGoals')
    .addEdge('analyzeGoals', 'makeRecommendation')
    .addEdge('makeRecommendation', 'provideNextSteps')
    .addEdge('provideNextSteps', END);

// 📝 STEP 6: Compile the Agent
const compiledAgent = languageRecommendationAgent.compile();

// 📝 STEP 7: Test Your Agent
async function testLanguageAgent() {
    const testCases = [
        {
            user_goal: "I want to build websites",
            experience_level: "Beginner",
            interests: "Web development"
        },
        {
            user_goal: "I want to analyze data and create visualizations",
            experience_level: "Intermediate",
            interests: "Data science"
        },
        {
            user_goal: "I want to create mobile apps",
            experience_level: "Beginner",
            interests: "Mobile development"
        },
        {
            user_goal: "I want to work in artificial intelligence",
            experience_level: "Advanced",
            interests: "Machine learning"
        }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log("\n" + "=".repeat(60));
            console.log(`🎯 Testing Agent with:`);
            console.log(`Goal: ${testCase.user_goal}`);
            console.log(`Level: ${testCase.experience_level}`);
            console.log(`Interests: ${testCase.interests}`);
            console.log("=".repeat(60));
            
            const startTime = Date.now();
            
            const result = await compiledAgent.invoke({
                user_goal: testCase.user_goal,
                experience_level: testCase.experience_level,
                interests: testCase.interests
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log("\n📊 Agent Analysis:");
            console.log(result.analysis);
            
            console.log("\n💡 Recommendation:");
            console.log(result.recommendation);
            
            console.log("\n🚀 Next Steps:");
            console.log(result.next_steps);
            
            console.log("\n📚 Resources:");
            console.log(result.resources);
            
            console.log(`\n⏱️ Processing time: ${duration}ms`);
            
        } catch (error) {
            console.error("❌ Error:", error.message);
        }
    }
}

// 📝 STEP 8: Interactive Version (Optional)
async function interactiveAgent() {
    console.log("\n🤖 Interactive Language Recommendation Agent");
    console.log("=" .repeat(50));
    
    // Simulate user input (in real app, this would come from user interface)
    const userInput = {
        user_goal: "I want to build web applications",
        experience_level: "Beginner",
        interests: "Frontend development"
    };
    
    console.log("👤 User Input:");
    console.log(`Goal: ${userInput.user_goal}`);
    console.log(`Level: ${userInput.experience_level}`);
    console.log(`Interests: ${userInput.interests}`);
    
    console.log("\n🤖 Agent Response:");
    
    const result = await compiledAgent.invoke(userInput);
    
    console.log("\n" + "─".repeat(50));
    console.log("📋 ANALYSIS:");
    console.log(result.analysis);
    
    console.log("\n" + "─".repeat(50));
    console.log("💡 RECOMMENDATION:");
    console.log(result.recommendation);
    
    console.log("\n" + "─".repeat(50));
    console.log("🚀 NEXT STEPS:");
    console.log(result.next_steps);
    
    console.log("\n" + "─".repeat(50));
    console.log("📚 RESOURCES:");
    console.log(result.resources);
}

// 🎯 HOW TO USE THIS IN YOUR PROJECT:

// 1. Export the agent for use in other files
export { compiledAgent, LanguageRecommendationState };

// 2. Use in an API endpoint
/*
app.post('/api/recommend-language', async (req, res) => {
    try {
        const result = await compiledAgent.invoke({
            user_goal: req.body.goal,
            experience_level: req.body.level,
            interests: req.body.interests
        });
        
        res.json({
            recommendation: result.recommendation,
            next_steps: result.next_steps,
            resources: result.resources
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
*/

// 3. Use in a frontend
/*
const getLanguageRecommendation = async (goal, level, interests) => {
    const response = await fetch('/api/recommend-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, level, interests })
    });
    
    return await response.json();
};
*/

// 🎉 CONGRATULATIONS! You've built your first agentic AI!

// Run the tests
console.log("🚀 Starting Language Recommendation Agent Tests...");
testLanguageAgent();

// Uncomment to run interactive version
// interactiveAgent();

