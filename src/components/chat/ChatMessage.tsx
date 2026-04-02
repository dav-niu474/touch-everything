'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from './CodeBlock';
import { ToolCallBlock } from './ToolCallBlock';
import type { Message } from '@/store/chat-store';
import { Bot, User, Loader2 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  if (isUser) {
    return (
      <div className="flex gap-3 py-4 px-4 sm:px-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="shrink-0 mt-0.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 border border-border/50">
            <User className="h-4 w-4 text-foreground/70" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-1.5">You</div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="flex gap-3 py-4 px-4 sm:px-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="shrink-0 mt-0.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#E8710A]/15 border border-[#E8710A]/30">
            <Bot className="h-4 w-4 text-[#E8710A]" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
            <span className="text-[#E8710A]/80">Touch Everything</span>
            {message.isStreaming && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin text-[#E8710A]/60" />
                <span className="text-[10px] text-muted-foreground/60">thinking...</span>
              </span>
            )}
          </div>
          
          {/* Tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mb-3">
              {message.toolCalls.map((tc) => (
                <ToolCallBlock key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {/* Content with markdown */}
          {message.content ? (
            <div className="prose-chat text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;
                    
                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded bg-muted/50 text-[#E8710A]/90 font-mono text-[0.8125rem] border border-border/30"
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    }
                    
                    return (
                      <CodeBlock
                        language={match?.[1] || 'text'}
                        code={String(children).replace(/\n$/, '')}
                      />
                    );
                  },
                  p({ children }) {
                    return <p className="mb-3 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="text-foreground/90">{children}</li>;
                  },
                  h1({ children }) {
                    return <h1 className="text-lg font-semibold mb-2 text-foreground">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-sm font-semibold mb-1.5 text-foreground">{children}</h3>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-[#E8710A]/40 pl-3 my-3 text-muted-foreground italic">
                        {children}
                      </blockquote>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E8710A]/80 hover:text-[#E8710A] underline underline-offset-2 transition-colors"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-3 overflow-x-auto rounded-lg border border-border/50">
                        <table className="min-w-full text-sm">{children}</table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return <thead className="bg-muted/30">{children}</thead>;
                  },
                  th({ children }) {
                    return (
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground border-b border-border/50">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="px-3 py-2 border-b border-border/30 text-foreground/80">
                        {children}
                      </td>
                    );
                  },
                  hr() {
                    return <hr className="my-4 border-border/30" />;
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-foreground">{children}</strong>;
                  },
                  em({ children }) {
                    return <em className="text-foreground/80">{children}</em>;
                  },
                  pre({ children }) {
                    // React-markdown wraps code blocks in pre, we let CodeBlock handle it
                    return <>{children}</>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : message.isStreaming ? (
            <div className="flex items-center gap-2 py-2">
              <div className="typing-indicator flex items-center gap-1">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#E8710A]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#E8710A]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-[#E8710A]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}
