# 🤖 LangGraph/LangChain Agentic AI Experiments

A hands-on exploration of agentic AI patterns and workflows using LangChain and LangGraph. This repository contains practical examples demonstrating core concepts like prompt chaining, routing, and parallelization that form the foundation of intelligent agent systems.

## 🎯 Project Purpose

This repository is my personal experimentation space for understanding and implementing agentic AI patterns. The goal is to break down complex agent architectures into digestible, runnable examples that demonstrate:

- **How agents think and make decisions**
- **How multiple agents coordinate and delegate**
- **How to optimize agent workflows through parallelization**
- **The transition from simple chains to complex agentic systems**

### My Perspective on Experimenting with Agentic AI

Agentic AI represents a paradigm shift from static prompt-response interactions to dynamic, goal-oriented systems. While traditional AI applications follow a linear path (input → process → output), agentic systems introduce:

1. **Autonomous Decision-Making**: Agents can evaluate situations and choose their own paths, similar to how humans break down complex problems.

2. **Modular Architecture**: By decomposing complex tasks into specialized sub-agents (like having a team of experts), we can build more reliable and maintainable systems.

3. **Parallel Processing**: Unlike sequential workflows, agentic systems can leverage parallelization to handle multiple tasks simultaneously, dramatically improving efficiency.

4. **Adaptability**: Agents can route tasks dynamically based on context, making them more flexible than rigid, pre-defined pipelines.

Through these experiments, I'm exploring how these concepts translate from theory to practice, identifying patterns that work well, and understanding the trade-offs involved in building production-ready agentic systems.

## 📁 Project Structure

```
langgraph/
├── 01_prompt_chaining.py          # Sequential prompt chaining basics
├── 02_routing.py                   # Dynamic routing and delegation
├── 03_parallelization.py           # Parallel task execution
├── *.js                            # JavaScript/Node.js implementations
├── *.md                            # Detailed guides and documentation
└── README.md                       # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** (for Python examples)
- **Node.js 18+** (for JavaScript examples)
- **OpenAI API Key** (or compatible LLM API)

### Python Setup

1. **Clone the repository** (if applicable) or navigate to the directory:
   ```bash
   cd langgraph
   ```

2. **Install dependencies**:
   ```bash
   pip install langchain-openai langchain-core python-dotenv
   ```
   
   Or create a `requirements.txt`:
   ```txt
   langchain-openai
   langchain-core
   python-dotenv
   ```

3. **Set up environment variables**:
   Create a `.env` file in the project root:
   ```env
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Run examples**:
   ```bash
   python 01_prompt_chaining.py
   python 02_routing.py
   python 03_parallelization.py
   ```

### JavaScript/Node.js Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file:
   ```env
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Run examples**:
   ```bash
   node simpleAgent.js
   node conditionalWorkflow.js
   # ... etc
   ```

## 📚 Examples Overview

### 1. Prompt Chaining (`01_prompt_chaining.py`)

**Concept**: Sequential processing where the output of one step becomes the input of the next.

**What it demonstrates**:
- Building multi-step pipelines using LangChain's LCEL (LangChain Expression Language)
- Passing data between sequential operations
- Debugging intermediate results in a chain

**Example Use Case**: Extract specifications → Transform to structured format → Generate final output

### 2. Routing (`02_routing.py`)

**Concept**: Dynamic decision-making where an agent routes tasks to specialized handlers.

**What it demonstrates**:
- Coordinator pattern with specialized sub-agents
- Conditional branching based on LLM analysis
- Task delegation to appropriate handlers

**Example Use Case**: A coordinator analyzes user requests and routes them to:
- `booking_handler` for booking-related tasks
- `info_handler` for information queries
- `unclear_handler` for ambiguous requests

### 3. Parallelization (`03_parallelization.py`)

**Concept**: Executing multiple independent tasks simultaneously to improve efficiency.

**What it demonstrates**:
- Running independent chains in parallel
- Combining parallel results into a synthesis
- Leveraging async/await for concurrent operations

**Example Use Case**: For a given topic, simultaneously:
- Generate a summary
- Create related questions
- Extract key terms
- Then synthesize all results into a comprehensive response

## 🧠 Key Concepts Explained

### Agentic AI vs Traditional AI

| Traditional AI | Agentic AI |
|---------------|------------|
| Single-pass processing | Multi-step reasoning |
| Static workflows | Dynamic routing |
| Sequential execution | Parallel + Sequential |
| Fixed behavior | Adaptive decision-making |

### Why These Patterns Matter

1. **Chaining**: Foundation for complex reasoning - allows breaking down problems into manageable steps.

2. **Routing**: Enables specialization - different agents excel at different tasks, leading to better outcomes.

3. **Parallelization**: Performance optimization - independent tasks don't need to wait for each other.

## 📖 Additional Resources

This repository includes several detailed guides:

- `AI_Agentic_Workflow_Guide.md` - Comprehensive guide to agentic workflow design
- `Beginner_Agent_Design_Guide.md` - Getting started with agent design
- `Agent_Design_Diagram.md` - Visual representations of agent architectures

## 🛠️ Technologies Used

- **LangChain** - Framework for building LLM applications
- **LangGraph** - Library for building stateful, multi-actor applications
- **OpenAI GPT Models** - Language models powering the agents
- **Python** / **JavaScript** - Implementation languages

## 🤝 Contributing

This is a personal learning repository, but I welcome:
- Bug reports
- Suggestions for additional examples
- Discussions about agentic AI patterns
- Improvements to documentation

## 📝 License

Check individual files for license information. Some files may be licensed under MIT License (see file headers).

## 🔗 Useful Links

- [LangChain Documentation](https://python.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 💡 Future Experiments

Ideas for future exploration:
- [ ] State management and memory in agents
- [ ] Multi-agent collaboration patterns
- [ ] Tool usage and function calling
- [ ] Error handling and recovery strategies
- [ ] Evaluation metrics for agentic systems
- [ ] Production deployment considerations

---

**Note**: These examples are for educational and experimental purposes. When building production systems, consider:
- Error handling and retry logic
- Rate limiting and API cost management
- Security and input validation
- Monitoring and observability
- Testing strategies for agentic systems

