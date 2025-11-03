# How Tool Calling Works Under the Hood in LangChain

## Overview

Tool calling (also called "function calling") allows LLMs to decide when to use external tools/functions. The LLM doesn't directly execute code—instead, it generates a structured request that your code then executes.

---

## Step-by-Step Breakdown

### Step 1: Tool Definition (Lines 19-26)

```19:26:05_tool_use.js
const multiply = tool(({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers",
  schema: z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  }),
});
```

**What happens:**
- The `tool()` function wraps your JavaScript function
- Your Zod schema is converted to a **JSON Schema** format
- This JSON Schema describes:
  - What the function does (description)
  - What parameters it needs (properties: `a`, `b`)
  - Types and constraints (both are numbers)

**Internal representation** (simplified):
```json
{
  "type": "function",
  "function": {
    "name": "multiply",
    "description": "Multiply two numbers",
    "parameters": {
      "type": "object",
      "properties": {
        "a": { "type": "number", "description": "First number" },
        "b": { "type": "number", "description": "Second number" }
      },
      "required": ["a", "b"]
    }
  }
}
```

---

### Step 2: Binding Tools to Model (Line 36)

```36:36:05_tool_use.js
const chatgptModelWithTools = chatgptModel.bindTools(tools);
```

**What `bindTools()` does internally:**

1. **Converts tools to JSON Schema format** (as shown above)
2. **Stores tool schemas** in the model's configuration
3. **Creates a new model wrapper** that includes tool information

**Key insight:** The model itself doesn't change. `bindTools()` creates a wrapper that:
- Maintains reference to your original model
- Keeps a list of available tools (as JSON schemas)
- Will include these schemas in API requests to the LLM provider

---

### Step 3: Invoking the Model (Line 42)

```42:42:05_tool_use.js
const response = await chatgptModelWithTools.invoke([new HumanMessage(query)]);
```

**What happens inside `invoke()`:**

1. **LangChain prepares the API request:**
   ```
   Messages: [
     { role: "user", content: "What is 15 multiplied by 23?" }
   ]
   
   Tools: [
     {
       type: "function",
       function: {
         name: "multiply",
         description: "Multiply two numbers",
         parameters: { ... }
       }
     }
   ]
   ```

2. **LangChain sends to OpenAI API:**
   - The messages (your query)
   - **The tool definitions** (JSON schemas)
   - A special flag: `tool_choice: "auto"` (let the model decide)

3. **OpenAI's GPT-4o processes:**
   - Reads your query: "What is 15 multiplied by 23?"
   - Sees available tools: `multiply` function
   - **Decision process:**
     - Does this query need the tool? Yes, it's asking for multiplication
     - Which tool? `multiply`
     - What parameters? `a=15, b=23`

4. **OpenAI returns a response in this format:**
   ```json
   {
     "id": "chatcmpl-...",
     "choices": [{
       "message": {
         "role": "assistant",
         "content": null,  // Empty or minimal
         "tool_calls": [   // This is the key part!
           {
             "id": "call_abc123",
             "type": "function",
             "function": {
               "name": "multiply",
               "arguments": "{\"a\": 15, \"b\": 23}"
             }
           }
         ]
       }
     }]
   }
   ```

**Note:** The LLM doesn't execute anything! It just says: "I want to call the `multiply` function with these arguments."

---

### Step 4: Parsing the Response (Lines 45-48)

```45:48:05_tool_use.js
console.log("Tool calls:", response.tool_calls);

// If model decided to use tools, execute them
if (response.tool_calls && response.tool_calls.length > 0) {
```

**What `response.tool_calls` contains:**
```javascript
[
  {
    id: "call_abc123",           // Unique ID for this tool call
    name: "multiply",             // Tool name
    args: { a: 15, b: 23 }       // Parsed arguments (LangChain parses the JSON string)
  }
]
```

**LangChain automatically:**
- Parses the JSON arguments string into a JavaScript object
- Extracts tool call metadata
- Stores it in `response.tool_calls` array

---

### Step 5: Executing the Tool (Lines 51-54)

```51:54:05_tool_use.js
for (const toolCall of response.tool_calls) {
  const tool = toolsByName[toolCall.name];
  if (tool) {
    const result = await tool.invoke(toolCall.args);
```

**What happens:**
1. **Find the tool:** Look up `multiply` in `toolsByName`
2. **Extract arguments:** `toolCall.args = { a: 15, b: 23 }`
3. **Call your function:**
   ```javascript
   // Internally, tool.invoke() does:
   multiply.func({ a: 15, b: 23 })  // Executes: 15 * 23
   // Returns: 345
   ```

**Important:** This is where **your actual JavaScript code runs**! The LLM never executes code—only your application does.

---

### Step 6: Creating Tool Messages (Lines 55-60)

```55:60:05_tool_use.js
toolMessages.push(
  new ToolMessage({
    content: String(result),
    tool_call_id: toolCall.id,
  })
);
```

**What is a ToolMessage?**
- A special message type in LangChain
- Contains:
  - `content`: The tool's result (e.g., `"345"`)
  - `tool_call_id`: Links this result to the specific tool call (`"call_abc123"`)

**Why the ID matters:**
- The LLM might call multiple tools
- Each tool result must be linked to its specific call
- This allows the LLM to correlate: "I called multiply with ID abc123, here's the result"

---

### Step 7: Sending Results Back (Lines 65-69)

```65:69:05_tool_use.js
const finalResponse = await chatgptModelWithTools.invoke([
  new HumanMessage(query),
  response,
  ...toolMessages,
]);
```

**Message chain sent to the LLM:**

```
1. HumanMessage: "What is 15 multiplied by 23?"
   ↓
2. AIMessage (with tool_calls): [I want to call multiply(15, 23)]
   ↓
3. ToolMessage: "345" (result from multiply function)
   ↓
4. LLM processes: "The user asked for 15×23, I called the tool, got 345"
   ↓
5. Final AIMessage: "15 multiplied by 23 equals 345."
```

**What the LLM sees:**
- The original question
- Its own tool call request
- The tool's result
- **Context:** "I have all the information I need to answer the user"

The LLM then generates a natural language response incorporating the tool result.

---

## Key Concepts

### 1. **The LLM Never Executes Code**
- It only generates structured requests (tool calls)
- Your application executes the actual functions
- This is by design for safety and control

### 2. **JSON Schema is the Bridge**
- Your Zod/TypeScript schemas → JSON Schema → Sent to LLM
- LLM understands JSON Schema (standard format)
- LLM generates JSON arguments → Your code parses and executes

### 3. **Two-Phase Communication**
- **Phase 1:** LLM decides to use a tool, generates a tool call
- **Phase 2:** Your code executes, sends results back, LLM generates final answer

### 4. **Tool Call ID Links Everything**
- Each tool call has a unique ID
- Tool results reference that ID
- Allows multiple concurrent tool calls

---

## Visual Flow Diagram

```
┌─────────────┐
│   Your Code │
│             │
│ 1. Define   │
│    tool()   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  bindTools()    │
│                 │
│ Converts to     │
│ JSON Schema     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ invoke() sends: │
│ - Query         │
│ - Tool schemas  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  OpenAI API     │
│                 │
│ LLM analyzes:   │
│ - Needs tool?   │
│ - Which tool?   │
│ - What params?  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Returns:        │
│ tool_calls: [   │
│   {name, args}  │
│ ]               │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Your Code       │
│ Executes tool   │
│ Gets result     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Send back:      │
│ - Original msg  │
│ - Tool call     │
│ - Tool result   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ LLM generates   │
│ final answer    │
└─────────────────┘
```

---

## Why This Architecture?

### 1. **Safety**
- LLM can't execute arbitrary code
- You control what functions are available
- You validate inputs before execution

### 2. **Flexibility**
- LLM can choose when to use tools
- Can call multiple tools
- Can make decisions based on tool results

### 3. **Standardization**
- Uses JSON Schema (industry standard)
- Works across different LLM providers
- Language-agnostic format

### 4. **Separation of Concerns**
- LLM: Decision making, natural language
- Your code: Actual computation, data access, side effects

---

## Debugging Tips

To see what's happening, you can log:

```javascript
// See the tool schema that's sent to LLM
console.log("Tool schemas:", tools.map(t => t.toJSON()));

// See the raw API request
console.log("Response object:", JSON.stringify(response, null, 2));

// See parsed tool calls
console.log("Tool calls:", response.tool_calls);
```

This gives you visibility into every step of the process!

