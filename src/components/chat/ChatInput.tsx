'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Send, Square, CornerDownLeft, Slash, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandPalette } from './CommandPalette';
import { ModelSelector } from './ModelSelector';
import { findCommand, type SlashCommand, type ModelInfo } from '@/lib/commands';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCommand: (command: string, args: string) => void;
  onModelSelect?: (model: ModelInfo) => void;
  currentModel?: string;
  onStop: () => void;
  isLoading: boolean;
}

const MAX_HISTORY = 50;

export function ChatInput({
  onSend,
  onCommand,
  onModelSelect,
  currentModel = 'deepseek-ai/deepseek-v3.1',
  onStop,
  isLoading,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [palettePosition, setPalettePosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Command palette state
  const isCommandMode = input.startsWith('/');
  const commandQuery = isCommandMode ? input : '';

  // Model selector state
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Command history for ↑/↓ navigation
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isNavigatingHistory, setIsNavigatingHistory] = useState(false);

  // Current selected command (for inline hint display)
  const [selectedCommand, setSelectedCommand] = useState<SlashCommand | null>(null);

  // Compute palette position based on input wrapper
  useEffect(() => {
    if (!inputWrapperRef.current || !isCommandMode) return;

    const rect = inputWrapperRef.current.getBoundingClientRect();
    setPalettePosition({
      top: rect.height + 4,
      left: 0,
      width: rect.width,
    });
  }, [input, isCommandMode]);

  // Resolve the currently matched command for inline hint
  const matchedCommand = useMemo(() => {
    if (!isCommandMode) return null;
    const spaceIdx = input.indexOf(' ');
    const cmdPart = spaceIdx > 0 ? input.slice(1, spaceIdx) : input.slice(1);
    return findCommand(cmdPart);
  }, [input, isCommandMode]);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const maxHeight = 24 * 6;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const pushToHistory = useCallback((text: string) => {
    if (!text.trim()) return;
    setHistory((prev) => {
      // Don't add duplicates of the most recent entry
      if (prev.length > 0 && prev[prev.length - 1] === text) return prev;
      return [...prev.slice(-MAX_HISTORY + 1), text];
    });
    setHistoryIndex(-1);
    setIsNavigatingHistory(false);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Check if it's a command
    if (trimmed.startsWith('/')) {
      const spaceIdx = trimmed.indexOf(' ');
      const cmdName = spaceIdx > 0 ? trimmed.slice(1, spaceIdx) : trimmed.slice(1);
      const args = spaceIdx > 0 ? trimmed.slice(spaceIdx + 1).trim() : '';
      const cmd = findCommand(cmdName);

      if (cmd) {
        if (cmdName === 'model' && !args) {
          setShowModelSelector(true);
          setInput('');
          pushToHistory(trimmed);
          return;
        }

        onCommand(cmdName, args);
        setInput('');
        pushToHistory(trimmed);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        return;
      }
    }

    onSend(trimmed);
    setInput('');
    pushToHistory(trimmed);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend, onCommand, pushToHistory]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // ↑/↓ history navigation (only when not in command mode)
      if (e.key === 'ArrowUp' && !isCommandMode) {
        if (history.length === 0) return;
        e.preventDefault();
        const newIndex = isNavigatingHistory
          ? Math.min(historyIndex + 1, history.length - 1)
          : history.length - 1;
        setHistoryIndex(newIndex);
        setIsNavigatingHistory(true);
        setInput(history[newIndex]);
        return;
      }

      if (e.key === 'ArrowDown' && !isCommandMode) {
        if (!isNavigatingHistory) return;
        e.preventDefault();
        const newIndex = historyIndex - 1;
        if (newIndex < 0) {
          setHistoryIndex(-1);
          setIsNavigatingHistory(false);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        // Let the palette/selector handle Enter when open
        if (isCommandMode || showModelSelector) {
          return;
        }
        e.preventDefault();
        handleSend();
      }

      // Escape to clear input when navigating history
      if (e.key === 'Escape' && isNavigatingHistory) {
        setHistoryIndex(-1);
        setIsNavigatingHistory(false);
        setInput('');
      }
    },
    [handleSend, isCommandMode, showModelSelector, history, historyIndex, isNavigatingHistory]
  );

  const handleCommandSelect = useCallback(
    (command: SlashCommand) => {
      if (command.requiresArgs) {
        setInput(`/${command.name} `);
        textareaRef.current?.focus();
      } else {
        if (command.name === 'model') {
          setShowModelSelector(true);
        } else {
          onCommand(command.name, '');
        }
        setInput('');
        pushToHistory(`/${command.name}`);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    },
    [onCommand, pushToHistory]
  );

  const handleModelSelect = useCallback(
    (model: ModelInfo) => {
      setShowModelSelector(false);
      onModelSelect?.(model);
    },
    [onModelSelect]
  );

  const handleModelClose = useCallback(() => {
    setShowModelSelector(false);
  }, []);

  const handleSlashClick = useCallback(() => {
    setInput('/');
    textareaRef.current?.focus();
  }, []);

  // Inline hint text below input
  const inlineHint = useMemo(() => {
    if (!isCommandMode) return null;
    // When typing just "/" or still filtering, show selected command from palette
    if (matchedCommand && input.indexOf(' ') > 0) {
      // User has already typed the command name and is adding args
      return {
        command: matchedCommand,
        hint: matchedCommand.argsPlaceholder || matchedCommand.usage || matchedCommand.description,
      };
    }
    return null;
  }, [isCommandMode, matchedCommand, input]);

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl px-4 sm:px-6 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="relative" ref={inputWrapperRef}>
          {/* Command Palette */}
          <CommandPalette
            isOpen={isCommandMode && !showModelSelector}
            query={commandQuery}
            position={palettePosition}
            onSelect={handleCommandSelect}
            onHover={setSelectedCommand}
            onClose={() => {
              if (input === '/') setInput('');
            }}
          />

          {/* Model Selector */}
          <ModelSelector
            isOpen={showModelSelector}
            currentModel={currentModel}
            position={palettePosition}
            onSelect={handleModelSelect}
            onClose={handleModelClose}
          />

          {/* Input area */}
          <div className="relative flex items-end gap-2 rounded-xl border border-border/60 bg-card/80 focus-within:border-[#E8710A]/40 focus-within:ring-1 focus-within:ring-[#E8710A]/20 transition-all shadow-lg shadow-black/20">
            {/* Slash command indicator / button */}
            {isCommandMode ? (
              <div className="flex items-center justify-center h-10 w-10 shrink-0 ml-1">
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-[#E8710A]/15 border border-[#E8710A]/30">
                  <span className="text-sm font-bold text-[#E8710A] font-mono">/</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 ml-1 mb-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-[#E8710A] hover:bg-[#E8710A]/10 transition-all"
                  onClick={handleSlashClick}
                  title="Slash commands (/)"
                >
                  <Slash className="h-4 w-4" />
                </Button>
                {history.length > 0 && !input && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30 transition-all"
                    onClick={() => {
                      setInput(history[history.length - 1]);
                      setHistoryIndex(history.length - 1);
                      setIsNavigatingHistory(true);
                      textareaRef.current?.focus();
                    }}
                    title="Previous command (↑)"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Reset history navigation when typing
                if (isNavigatingHistory) {
                  setIsNavigatingHistory(false);
                  setHistoryIndex(-1);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={isCommandMode ? 'Type a command...' : 'Send a message...'}
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:opacity-50 min-h-[2.75rem] max-h-[9rem] font-mono leading-relaxed"
            />

            <div className="flex items-center gap-1 px-2 pb-2">
              {!isLoading && input.trim() && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/40 mr-1">
                  <CornerDownLeft className="h-3 w-3" />
                </div>
              )}

              {isLoading ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 shrink-0"
                  onClick={onStop}
                  title="Stop generation"
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-[#E8710A] hover:text-[#E8710A]/80 hover:bg-[#E8710A]/10 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  title="Send message (Enter)"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Inline command hint - shows below input when command is recognized */}
          {inlineHint && !showModelSelector && (
            <div className="flex items-center gap-2 mt-1.5 px-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
              <div className="flex items-center gap-1.5">
                <inlineHint.command.icon className="w-3 h-3 text-[#E8710A]/60" />
                <span className="text-[11px] font-medium text-[#E8710A]/80 font-mono">
                  /{inlineHint.command.name}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/50">
                {inlineHint.hint}
              </span>
              {inlineHint.command.aliases.length > 0 && (
                <span className="text-[10px] text-muted-foreground/30 hidden sm:inline">
                  aliases: {inlineHint.command.aliases.map(a => `/${a}`).join(', ')}
                </span>
              )}
            </div>
          )}

          {/* Hover hint - shows description of command being hovered in palette */}
          {isCommandMode && !inlineHint && selectedCommand && !showModelSelector && input === '/' && (
            <div className="flex items-center gap-2 mt-1.5 px-3 animate-in fade-in slide-in-from-bottom-1 duration-150">
              <div className="flex items-center gap-1.5">
                <selectedCommand.icon className="w-3 h-3 text-[#E8710A]/60" />
                <span className="text-[11px] font-medium text-[#E8710A]/80 font-mono">
                  /{selectedCommand.name}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground/50">
                {selectedCommand.description}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center mt-2">
          <p className="text-[11px] text-muted-foreground/30">
            Touch Everything may make mistakes. Verify important information.
            <span className="mx-1.5">·</span>
            Type <kbd className="px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono text-[10px]">/</kbd> for commands
            <span className="mx-1.5">·</span>
            <kbd className="px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono text-[10px]">↑↓</kbd> history
          </p>
        </div>
      </div>
    </div>
  );
}
