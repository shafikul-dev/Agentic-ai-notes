
import { StateGraph, END, Annotation } from "@langchain/langgraph";

// Define a simple state using Annotation
const SimpleState = Annotation.Root({
  message: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
});

const graph = new StateGraph(SimpleState)
  .addNode("start", async () => ({ message: "LangGraph is awesome!" }))
  .addNode("summarizer", async (state) => ({ 
    message: state.message.slice(0, 10) 
  }))
  .addEdge("start", "summarizer")
  .addEdge("summarizer", END)
  .setEntryPoint("start");

const app = graph.compile();
const result = await app.invoke({ message: "" });
console.log(result);
