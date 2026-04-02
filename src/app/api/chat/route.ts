import { NextRequest } from 'next/server';
import { chatCompletion, type ChatMessage as NvidiaMessage } from '@/lib/nvidia';
import { toolDefinitions, executeTool, type ToolResult } from '@/lib/tools';

const DEFAULT_MODEL = 'deepseek-ai/deepseek-v3.1';

const SYSTEM_PROMPT = `You are Touch Everything, an expert AI coding assistant. You help users with software engineering tasks including writing code, debugging, refactoring, explaining technical concepts, and managing project files.

You have access to the following tools:
- **bash**: Execute shell commands (e.g., build, test, install packages, git operations)
- **file_read**: Read file contents to examine existing code
- **file_write**: Create or overwrite files with new content
- **file_edit**: Make targeted edits to existing files via find-and-replace
- **glob_search**: Search for files by name pattern (e.g., "**/*.ts")
- **grep_search**: Search for patterns in file contents using regex

Important guidelines:
- When the user asks you to do something that requires using tools, ALWAYS use the tools. Don't just describe what you would do.
- Before running bash commands, briefly explain what you're about to do.
- Always read files before editing them to understand the current content.
- When writing code, provide complete, working implementations.
- Use markdown formatting with proper code blocks and language tags.
- Be concise but thorough. Focus on being helpful and accurate.
- If a tool fails, analyze the error and try a different approach.
- Respond in the same language the user uses.`;

const MAX_TOOL_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();
    const selectedModel = model && typeof model === 'string' ? model : DEFAULT_MODEL;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();

    function sendSSE(data: object) {
      return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build the conversation messages for the API
          const apiMessages: NvidiaMessage[] = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          ];

          let toolRound = 0;

          while (toolRound < MAX_TOOL_ROUNDS) {
            toolRound++;

            // Call NVIDIA API (non-streaming for tool loop)
            const response = await chatCompletion(
              apiMessages,
              toolDefinitions,
              selectedModel,
              0.3,
              4096
            );

            // If there's text content, stream it to the client
            if (response.content) {
              // Stream text word by word for a nice UX
              const words = response.content.split(/(\s+)/);
              let buffer = '';
              for (const word of words) {
                buffer += word;
                controller.enqueue(
                  sendSSE({ type: 'content', content: word })
                );
              }
            }

            // If no tool calls, we're done
            if (!response.tool_calls || response.tool_calls.length === 0) {
              break;
            }

            // Process tool calls
            // Add the assistant message (with tool_calls) to the conversation
            apiMessages.push({
              role: 'assistant',
              content: response.content || null,
              tool_calls: response.tool_calls.map((tc) => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                  name: tc.function.name,
                  arguments: tc.function.arguments,
                },
              })),
            });

            // Execute each tool and send results to client
            for (const toolCall of response.tool_calls) {
              const toolName = toolCall.function.name;
              const toolArgs = toolCall.function.arguments;

              // Notify client about tool call
              let parsedArgs: Record<string, unknown> = {};
              try {
                parsedArgs = JSON.parse(toolArgs);
              } catch {
                parsedArgs = { raw: toolArgs };
              }

              controller.enqueue(
                sendSSE({
                  type: 'tool_call',
                  toolCallId: toolCall.id,
                  name: toolName,
                  arguments: parsedArgs,
                })
              );

              // Execute the tool
              let result: ToolResult;
              try {
                result = await executeTool(toolName, toolArgs);
              } catch (error: unknown) {
                result = {
                  success: false,
                  output: '',
                  error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
                };
              }

              // Send result to client
              controller.enqueue(
                sendSSE({
                  type: 'tool_result',
                  toolCallId: toolCall.id,
                  result: result.success ? result.output : `Error: ${result.error}\n${result.output}`,
                  status: result.success ? 'completed' : 'error',
                })
              );

              // Add tool result to the conversation for the API
              apiMessages.push({
                role: 'tool',
                content: result.success ? result.output : `Error: ${result.error}\n${result.output}`,
                tool_call_id: toolCall.id,
              });
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('[Chat API Error]', errorMessage);

          // Try to send error to client before closing
          try {
            controller.enqueue(
              sendSSE({ type: 'error', message: errorMessage })
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch {
            // Stream might already be closed
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
