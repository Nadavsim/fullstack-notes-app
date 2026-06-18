// backend/services/aiService.ts

const MAX_ROUND_TRIPS = 3;

// The tool catalog we expose to the LLM
const tools = [
  {
    type: 'function',
    function: {
      name: 'filter_notes',
      description: 'Search the notes collection by substring match on content. Returns up to 10 matches.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
];

export async function runAgent({ prompt }: { prompt: string }): Promise<{ text: string }> {
  const messages: any[] = [{ role: 'user', content: prompt }];

  for (let i = 0; i < MAX_ROUND_TRIPS; i++) {
    // 1. Send the current conversation and tools to Ollama
    let r;
    try {
      r = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:3b',
          messages,
          tools,
          stream: false,
        }),
      });
    } catch (error) {
      // If fetch fails completely (e.g., Ollama is off)
      const err = new Error('Ollama is not reachable') as Error & { status?: number };
      err.status = 502;
      throw err;
    }

    if (!r.ok) {
      const err = new Error('Error from Ollama API') as Error & { status?: number };
      err.status = 502;
      throw err;
    }

    const { message } = await r.json();
    
    // Push the assistant's message into the conversation history
    messages.push(message);

    // 2. If the LLM didn't call any tools, it means it has its final answer!
    if (!message.tool_calls?.length) {
      return { text: message.content ?? '' };
    }

    // 3. If it DID call a tool, dispatch the call to our local backend
    for (const call of message.tool_calls) {
      const args = typeof call.function.arguments === 'string'
        ? JSON.parse(call.function.arguments)
        : call.function.arguments;

      // Call the route we just built!
      const filterRes = await fetch(`http://localhost:3001/notes/filter?query=${encodeURIComponent(args.query)}`);
      const toolResultText = await filterRes.text();

      // Push the database results back to the LLM
      messages.push({ 
        role: 'tool', 
        content: toolResultText 
      });
    }
  }

  // 4. Safety net: If it loops 3 times without a final answer, cut it off
  const err = new Error('Agent exceeded round-trip cap') as Error & { status?: number };
  err.status = 504;
  throw err;
}