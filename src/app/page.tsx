'use client';

import { useRef, useEffect, useCallback, useState, Component, type ReactNode } from 'react';
import { Bot, Trash2, Sparkles, Terminal, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { SystemMessage } from '@/components/chat/SystemMessage';
import { useChatStore } from '@/store/chat-store';
import { useCommandStore } from '@/store/command-store';
import { executeCommand } from '@/lib/command-handlers';
import { AVAILABLE_MODELS, modelDisplayNames, type ModelInfo } from '@/lib/commands';

interface SystemNotification {
  id: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
  timestamp: number;
}

// ─── Error Boundary ──────────────────────────────────────────────────────

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className="px-4 py-2 rounded-lg bg-[#E8710A] text-white text-sm font-medium hover:bg-[#E8710A]/90 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Home />
    </ErrorBoundary>
  );
}

function Home() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, stopGeneration, clearChat, removeLastExchange } = useChatStore();
  const cmdStore = useCommandStore();

  // System notifications for command output
  const [systemMessages, setSystemMessages] = useState<SystemNotification[]>([]);

  // Load persisted settings on mount
  useEffect(() => {
    cmdStore.loadFromStorage();
  }, [cmdStore]);

  // Apply theme from store
  useEffect(() => {
    const html = document.documentElement;
    if (cmdStore.theme === 'dark') {
      html.classList.add('dark');
    } else if (cmdStore.theme === 'light') {
      html.classList.remove('dark');
    } else if (cmdStore.theme === 'terminal-green') {
      html.classList.add('dark');
    }
  }, [cmdStore.theme]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, systemMessages, scrollToBottom]);

  const addSystemMessage = useCallback(
    (content: string, type: SystemNotification['type'] = 'command') => {
      const notification: SystemNotification = {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        content,
        type,
        timestamp: Date.now(),
      };
      setSystemMessages((prev) => [...prev, notification]);
    },
    []
  );

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content, cmdStore.currentModel);
    },
    [sendMessage, cmdStore.currentModel]
  );

  // ── Command Handler ────────────────────────────────────────────────────────
  const handleCommand = useCallback(
    async (command: string, args: string) => {
      // All commands go through the unified handler engine
      const result = await executeCommand(command, args, {
        messages,
        isLoading,
        currentModel: cmdStore.currentModel,
        theme: cmdStore.theme,
        sessionName: cmdStore.sessionName,
        planMode: cmdStore.planMode,
        fastMode: cmdStore.fastMode,
        effort: cmdStore.effort,
        sessionStartTime: cmdStore.sessionStartTime,
      });

      switch (result.type) {
        case 'message': {
          addSystemMessage(result.content || `Command /${command} executed.`, 'info');
          break;
        }
        case 'action': {
          if (!result.action) break;
          const { type, value } = result.action;

          switch (type) {
            case 'clear': {
              clearChat();
              setSystemMessages([]);
              addSystemMessage('Conversation cleared.', 'success');
              break;
            }
            case 'undo': {
              removeLastExchange();
              addSystemMessage('Last exchange removed.', 'success');
              break;
            }
            case 'copy': {
              const textToCopy = (value as string) || '';
              if (navigator.clipboard && textToCopy) {
                navigator.clipboard.writeText(textToCopy);
                addSystemMessage('Copied to clipboard!', 'success');
              } else {
                addSystemMessage('Nothing to copy.', 'warning');
              }
              break;
            }
            case 'download-file': {
              const fileData = value as { filename: string; content: string };
              if (fileData) {
                const blob = new Blob([fileData.content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileData.filename;
                a.click();
                URL.revokeObjectURL(url);
                addSystemMessage(`File downloaded: ${fileData.filename}`, 'success');
              }
              break;
            }
            case 'toggle-theme': {
              cmdStore.cycleTheme();
              const nextTheme = cmdStore.theme === 'dark' ? 'light' : cmdStore.theme === 'light' ? 'terminal-green' : 'dark';
              addSystemMessage(`Theme switched to **${nextTheme}** mode.\nAvailable themes: dark, light, terminal-green\nUse /theme to cycle.`, 'success');
              break;
            }
            case 'toggle-plan': {
              cmdStore.togglePlanMode();
              addSystemMessage(
                `Plan mode: **${cmdStore.planMode ? 'ON' : 'OFF'}**\n${cmdStore.planMode ? 'The AI will think first and create a plan before executing.' : 'The AI will respond directly without planning.'}`,
                'success'
              );
              break;
            }
            case 'toggle-fast': {
              cmdStore.toggleFastMode();
              addSystemMessage(
                `Fast mode: **${cmdStore.fastMode ? 'ON' : 'OFF'}**\n${cmdStore.fastMode ? 'Responses will be faster but may be less detailed.' : 'Quality mode enabled for thorough responses.'}`,
                'success'
              );
              break;
            }
            case 'set-effort': {
              const level = value as string;
              cmdStore.setEffort(level as 'low' | 'medium' | 'high');
              addSystemMessage(`Reasoning effort set to **${level}**.`, 'success');
              break;
            }
            case 'set-model': {
              const modelId = value as string;
              cmdStore.setModel(modelId);
              addSystemMessage(
                `Model changed to **${modelDisplayNames[modelId] || modelId}**\n  ID: ${modelId}`,
                'success'
              );
              break;
            }
            case 'cycle-model': {
              cmdStore.cycleModel();
              addSystemMessage(
                `Model: **${modelDisplayNames[cmdStore.currentModel] || cmdStore.currentModel}**\n  Use /model to select a specific model.`,
                'success'
              );
              break;
            }
            case 'rename': {
              const name = value as string;
              cmdStore.setSessionName(name);
              addSystemMessage(`Session renamed to: **${name}**`, 'success');
              break;
            }
            case 'dismiss': {
              setSystemMessages([]);
              addSystemMessage('System messages dismissed.', 'success');
              break;
            }
            default: {
              addSystemMessage(`Command /${command} executed.`, 'success');
            }
          }
          break;
        }
        case 'ai-message': {
          // AI-triggered commands: show a brief notification then send to chat
          if (result.content) {
            addSystemMessage(`Executing /${command}...`, 'info');
            sendMessage(result.content);
          }
          break;
        }
        case 'silent': {
          break;
        }
      }
    },
    [messages, isLoading, clearChat, sendMessage, addSystemMessage, removeLastExchange, cmdStore]
  );

  const handleModelSelect = useCallback(
    (model: ModelInfo) => {
      cmdStore.setModel(model.id);
      addSystemMessage(
        `Model changed to **${model.name}**\n  ID: ${model.id}\n  ${model.description}`,
        'success'
      );
    },
    [addSystemMessage, cmdStore]
  );

  const hasMessages = messages.length > 0;
  const displayName = cmdStore.sessionName || 'Untitled Session';

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 h-12">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#E8710A]/15 border border-[#E8710A]/30">
              <Bot className="h-4 w-4 text-[#E8710A]" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-foreground tracking-tight">
                Touch Everything
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                NIM
              </span>
              {/* Plan mode indicator */}
              {cmdStore.planMode && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                  PLAN
                </span>
              )}
              {/* Fast mode indicator */}
              {cmdStore.fastMode && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                  FAST
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Session name badge */}
            <span className="hidden md:inline-flex items-center max-w-[200px] truncate text-[11px] text-muted-foreground/50 mr-2 px-2 py-0.5 rounded-md bg-muted/30 border border-border/30">
              {displayName}
            </span>

            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground hover:text-foreground text-xs"
                onClick={clearChat}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto chat-scrollbar"
      >
        {hasMessages || systemMessages.length > 0 ? (
          <div className="max-w-3xl mx-auto">
            {/* System messages */}
            {systemMessages.map((sysMsg) => (
              <SystemMessage
                key={sysMsg.id}
                content={sysMsg.content}
                type={sysMsg.type}
              />
            ))}

            {/* Chat messages */}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        onSend={handleSend}
        onCommand={handleCommand}
        onModelSelect={handleModelSelect}
        currentModel={cmdStore.currentModel}
        onStop={stopGeneration}
        isLoading={isLoading}
      />
    </div>
  );
}

function WelcomeScreen() {
  const { sendMessage } = useChatStore();

  const suggestions = [
    {
      icon: Terminal,
      label: 'Explain this code',
      prompt: 'Explain what this code does and how it works:',
      description: 'Get a detailed explanation of any code snippet',
    },
    {
      icon: MessageSquare,
      label: 'Debug an issue',
      prompt: "I have a bug in my code. Here's the error I'm seeing:",
      description: 'Get help identifying and fixing bugs',
    },
    {
      icon: Sparkles,
      label: 'Write new code',
      prompt: 'Help me write a function that:',
      description: 'Generate new code from your requirements',
    },
    {
      icon: Bot,
      label: 'Refactor code',
      prompt: 'Help me refactor this code to be cleaner and more maintainable:',
      description: 'Improve code quality and structure',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-11rem)] px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-[#E8710A]/10 border border-[#E8710A]/20 shadow-lg shadow-[#E8710A]/5">
            <Bot className="h-8 w-8 text-[#E8710A]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Touch Everything
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
              Claude Code for the Web. Ask questions, write code, debug issues,
              and manage your project — all through natural language.
            </p>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              onClick={() => sendMessage(suggestion.prompt)}
              className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-4 text-left hover:bg-card/80 hover:border-[#E8710A]/30 transition-all duration-200"
            >
              <div className="shrink-0 mt-0.5 flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 group-hover:bg-[#E8710A]/10 transition-colors">
                <suggestion.icon className="h-4 w-4 text-muted-foreground group-hover:text-[#E8710A] transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground group-hover:text-[#E8710A]/90 transition-colors">
                  {suggestion.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {suggestion.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground/30">
            Touch Everything is powered by NVIDIA NIM
          </p>
          <p className="text-[11px] text-muted-foreground/25 mt-1">
            Type <kbd className="px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono text-[10px]">/</kbd> for commands
          </p>
        </div>
      </div>
    </div>
  );
}
