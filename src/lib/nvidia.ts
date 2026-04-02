// ─── NVIDIA API Client ───────────────────────────────────────────────────────
// OpenAI-compatible streaming chat completions via NVIDIA's API
// ─────────────────────────────────────────────────────────────────────────────

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_API_KEY = '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';
const DEFAULT_MODEL = 'deepseek-ai/deepseek-v3.1';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCallChunk[];
}

export interface ToolCallChunk {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface StreamDelta {
  type: 'text_delta' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end';
  content?: string;
  tool_call_id?: string;
  tool_name?: string;
  tool_arguments?: string;
}

// ─── Retry Logic ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        // Rate limited — back off and retry
        lastError = new Error(`Rate limited (429). Attempt ${attempt + 1}/${retries}`);
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API error ${response.status}: ${errorText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes('NVIDIA API error')) {
        throw error; // Non-retryable API errors
      }
      lastError = error as Error;
      if (attempt < retries - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Failed after retries');
}

// ─── Streaming Chat Completions ──────────────────────────────────────────────

/**
 * Send a streaming chat completion request to NVIDIA's API.
 * Yields parsed delta objects as they arrive.
 */
export async function* streamChatCompletion(
  messages: ChatMessage[],
  tools: unknown[] = [],
  model: string = DEFAULT_MODEL,
  temperature: number = 0.3,
  maxTokens: number = 4096
): AsyncGenerator<StreamDelta> {
  const url = `${NVIDIA_BASE_URL}/chat/completions`;

  const body: Record<string, unknown> = {
    model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    })),
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  if (tools.length > 0) {
    body.tools = tools;
  }

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.body) {
    throw new Error('Response body is null — streaming not supported');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Track tool call accumulation
  const toolCallMap = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          // Finalize any pending tool calls
          for (const [index, tc] of toolCallMap) {
            yield {
              type: 'tool_call_end',
              tool_call_id: tc.id,
              tool_name: tc.name,
              tool_arguments: tc.arguments,
            };
          }
          toolCallMap.clear();
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta;

          // Handle text content
          if (delta?.content) {
            yield {
              type: 'text_delta',
              content: delta.content,
            };
          }

          // Handle tool calls (accumulated across chunks)
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;

              if (tc.id) {
                // New tool call starting
                toolCallMap.set(idx, {
                  id: tc.id,
                  name: tc.function?.name || '',
                  arguments: '',
                });
                yield {
                  type: 'tool_call_start',
                  tool_call_id: tc.id,
                  tool_name: tc.function?.name || '',
                };
              }

              if (tc.function?.arguments) {
                const existing = toolCallMap.get(idx);
                if (existing) {
                  existing.arguments += tc.function.arguments;
                }
                yield {
                  type: 'tool_call_delta',
                  tool_call_id: existing?.id || '',
                  tool_arguments: tc.function.arguments,
                };
              }
            }
          }

          // Check if this choice is finished
          if (choice.finish_reason === 'tool_calls') {
            // Emit completed tool calls
            for (const [index, tc] of toolCallMap) {
              yield {
                type: 'tool_call_end',
                tool_call_id: tc.id,
                tool_name: tc.name,
                tool_arguments: tc.arguments,
              };
            }
            toolCallMap.clear();
          }
        } catch {
          // Skip malformed JSON chunks
          continue;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── Non-streaming Chat Completion (for tool loop) ──────────────────────────

export interface ChatCompletionResponse {
  content: string | null;
  tool_calls: ToolCallChunk[] | null;
  finishReason: string;
}

/**
 * Send a non-streaming chat completion request.
 * Used internally for the agentic tool loop.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  tools: unknown[] = [],
  model: string = DEFAULT_MODEL,
  temperature: number = 0.3,
  maxTokens: number = 4096
): Promise<ChatCompletionResponse> {
  const url = `${NVIDIA_BASE_URL}/chat/completions`;

  const body: Record<string, unknown> = {
    model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
    })),
    temperature,
    max_tokens: maxTokens,
  };

  if (tools.length > 0) {
    body.tools = tools;
  }

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    content: choice?.message?.content || null,
    tool_calls: choice?.message?.tool_calls || null,
    finishReason: choice?.finish_reason || 'unknown',
  };
}
