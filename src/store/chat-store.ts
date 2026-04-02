import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status?: 'running' | 'completed' | 'error';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
  isStreaming?: boolean;
}

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  abortController: AbortController | null;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  clearChat: () => void;
  removeLastExchange: () => void;
  updateStreamingMessage: (id: string, content: string, toolCalls?: ToolCall[]) => void;
  finalizeMessage: (id: string) => void;
  setToolCallResult: (messageId: string, toolCallId: string, result: string, status: 'completed' | 'error') => void;
  setToolCallStatus: (messageId: string, toolCallId: string, status: 'running' | 'completed' | 'error') => void;
  addToolCallToMessage: (messageId: string, toolCall: ToolCall) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  abortController: null,

  sendMessage: async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      toolCalls: [],
      timestamp: Date.now(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isLoading: true,
      error: null,
    }));

    const abortController = new AbortController();
    set({ abortController });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...get().messages.slice(0, -1), userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content') {
                accumulatedContent += parsed.content || '';
                get().updateStreamingMessage(assistantMessage.id, accumulatedContent);
              } else if (parsed.type === 'tool_call') {
                const toolCall: ToolCall = {
                  id: parsed.toolCallId || uuidv4(),
                  name: parsed.name,
                  arguments: parsed.arguments || {},
                  status: 'running',
                };
                get().addToolCallToMessage(assistantMessage.id, toolCall);
                get().updateStreamingMessage(assistantMessage.id, accumulatedContent);
              } else if (parsed.type === 'tool_result') {
                get().setToolCallResult(
                  assistantMessage.id,
                  parsed.toolCallId,
                  parsed.result || '',
                  parsed.status || 'completed'
                );
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Unknown error from server');
              }
            } catch (e) {
              if (e instanceof SyntaxError) {
                // Skip malformed JSON
                continue;
              }
              throw e;
            }
          }
        }
      }

      get().finalizeMessage(assistantMessage.id);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        get().finalizeMessage(assistantMessage.id);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        set({ error: errorMessage });
        get().finalizeMessage(assistantMessage.id);
      }
    } finally {
      set({ isLoading: false, abortController: null });
    }
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, isLoading: false });
    }
  },

  clearChat: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ messages: [], isLoading: false, error: null, abortController: null });
  },

  removeLastExchange: () => {
    const { messages } = get();
    if (messages.length === 0) return;
    const lastUserIdx = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    let removeCount = 1;
    if (lastUserIdx + 1 < messages.length && messages[lastUserIdx + 1].role === 'assistant') {
      removeCount = 2;
    }
    set({ messages: messages.slice(0, -removeCount) });
  },

  updateStreamingMessage: (id, content, toolCalls) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id
          ? { ...msg, content, ...(toolCalls ? { toolCalls } : {}) }
          : msg
      ),
    }));
  },

  finalizeMessage: (id) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, isStreaming: false } : msg
      ),
    }));
  },

  setToolCallResult: (messageId, toolCallId, result, status) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              toolCalls: msg.toolCalls?.map((tc) =>
                tc.id === toolCallId ? { ...tc, result, status } : tc
              ),
            }
          : msg
      ),
    }));
  },

  setToolCallStatus: (messageId, toolCallId, status) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              toolCalls: msg.toolCalls?.map((tc) =>
                tc.id === toolCallId ? { ...tc, status } : tc
              ),
            }
          : msg
      ),
    }));
  },

  addToolCallToMessage: (messageId, toolCall) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, toolCalls: [...(msg.toolCalls || []), toolCall] }
          : msg
      ),
    }));
  },
}));
