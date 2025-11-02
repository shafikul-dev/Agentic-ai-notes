# Reflection Loop Flow Diagram

This diagram visualizes how the reflection loop in `04_refection.py` works.

## Main Flow Diagram

```mermaid
flowchart TD
    Start([Start: run_reflection_loop]) --> Init[Initialize Variables:<br/>max_iterations = 3<br/>current_code = ''<br/>message_history = task_prompt]
    
    Init --> LoopStart{For i in range<br/>max_iterations}
    
    LoopStart -->|Iteration i| CheckIter{Is i == 0?}
    
    CheckIter -->|Yes - First Iteration| GenStage[STAGE 1: GENERATE<br/>llm.invoke message_history<br/>Generate initial code]
    CheckIter -->|No - Subsequent| RefineStage[STAGE 1: REFINE<br/>Add refine instruction to history<br/>llm.invoke message_history<br/>Refine code based on critiques]
    
    GenStage --> SaveCode1[Save generated code<br/>current_code = response.content]
    RefineStage --> SaveCode2[Save refined code<br/>current_code = response.content]
    
    SaveCode1 --> AddToHistory[Add response to message_history]
    SaveCode2 --> AddToHistory
    
    AddToHistory --> ReflectStage[STAGE 2: REFLECT<br/>Create reflector_prompt with:<br/>- SystemMessage: Senior engineer role<br/>- HumanMessage: Original task + current code]
    
    ReflectStage --> InvokeCritique[llm.invoke reflector_prompt<br/>Get critique response]
    
    InvokeCritique --> CheckPerfect{Does critique<br/>contain<br/>'CODE_IS_PERFECT'?}
    
    CheckPerfect -->|Yes| StopLoop[BREAK from loop<br/>Code is perfect!]
    CheckPerfect -->|No| PrintCritique[Print critique]
    
    PrintCritique --> AddCritique[Add critique to message_history<br/>for next iteration]
    
    AddCritique --> Increment[Increment iteration counter<br/>i = i + 1]
    
    Increment --> LoopStart
    
    StopLoop --> MaxCheck{Did loop<br/>reach max_iterations<br/>without perfect?}
    LoopStart -->|All iterations complete| MaxCheck
    
    MaxCheck --> FinalResult[Print Final Result:<br/>Current refined code]
    
    FinalResult --> End([End])
    
    style Start fill:#e1f5e1
    style End fill:#ffe1e1
    style GenStage fill:#e1e5ff
    style RefineStage fill:#e1e5ff
    style ReflectStage fill:#ffe5e1
    style CheckPerfect fill:#fff5e1
    style StopLoop fill:#e1ffe5
    style FinalResult fill:#f5e1ff
```

## Message History Flow (Sequence Diagram)

```mermaid
sequenceDiagram
    participant System
    participant LLM as LLM (Generator)
    participant Reflector as LLM (Reviewer)
    participant History as message_history
    
    Note over System,History: ITERATION 1
    System->>History: Initialize with task_prompt
    System->>LLM: invoke(message_history)
    LLM->>History: Add generated_code_v1
    System->>Reflector: invoke(reflector_prompt)
    Reflector-->>System: critique_1 (with feedback)
    alt critique contains "CODE_IS_PERFECT"
        System->>System: BREAK - Code is perfect!
    else critique has issues
        System->>History: Add critique_1
        Note over System,History: ITERATION 2
        System->>History: Add "Please refine..." instruction
        System->>LLM: invoke(message_history with all context)
        LLM->>History: Add generated_code_v2
        System->>Reflector: invoke(reflector_prompt with v2)
        Reflector-->>System: critique_2
        alt critique contains "CODE_IS_PERFECT"
            System->>System: BREAK - Code is perfect!
        else critique has issues
            System->>History: Add critique_2
            Note over System,History: ITERATION 3 (final)
            System->>History: Add "Please refine..." instruction
            System->>LLM: invoke(message_history with all context)
            LLM->>History: Add generated_code_v3
            System->>Reflector: invoke(reflector_prompt with v3)
            Reflector-->>System: critique_3
        end
    end
    System->>System: Print final code
```

## Stage Comparison

```mermaid
graph LR
    subgraph "STAGE 1: GENERATE/REFINE"
        A1[Uses message_history<br/>with full context] --> A2[Generates/Refines Code]
        A2 --> A3[Updates current_code]
    end
    
    subgraph "STAGE 2: REFLECT"
        B1[Uses separate reflector_prompt<br/>No message_history] --> B2[Reviews current_code<br/>against original task]
        B2 --> B3[Returns critique<br/>or 'CODE_IS_PERFECT']
    end
    
    A3 --> B1
    B3 -->|If not perfect| A1
    B3 -->|If perfect| C[Stop Loop]
```

## Key Points

1. **Stopping Condition**: The loop stops when the critique contains the exact phrase `"CODE_IS_PERFECT"` (line 77 in code)
2. **Message History**: Builds up across iterations to provide full context to the generator
3. **Two-Stage Process**: 
   - Stage 1 uses accumulated history (context-aware)
   - Stage 2 uses fresh prompt (objective review)
4. **Maximum Iterations**: Will stop after 3 iterations even if not perfect


