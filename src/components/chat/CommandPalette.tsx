'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CornerDownLeft, ArrowUpDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  searchCommands,
  getCommandsByCategory,
  CATEGORY_ICONS,
  type SlashCommand,
  type CommandCategory,
} from '@/lib/commands';

interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number; width: number };
  onSelect: (command: SlashCommand) => void;
  onHover?: (command: SlashCommand | null) => void;
  onClose: () => void;
}

export function CommandPalette({
  isOpen,
  query,
  position,
  onSelect,
  onHover,
  onClose,
}: CommandPaletteProps) {
  const [prevQuery, setPrevQuery] = useState(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset selected index when query changes
  if (prevQuery !== query) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  const filteredCommands = useMemo(() => searchCommands(query), [query]);
  const grouped = useMemo(
    () => getCommandsByCategory(filteredCommands),
    [filteredCommands]
  );

  // Flatten commands for index-based navigation
  const flatCommands = useMemo(() => {
    const flat: SlashCommand[] = [];
    for (const cmds of Object.values(grouped)) {
      flat.push(...cmds);
    }
    return flat;
  }, [grouped]);

  // Build category offsets for group headers
  const categoryOffsets = useMemo(() => {
    const offsets: number[] = [];
    let idx = 0;
    for (const cmds of Object.values(grouped)) {
      offsets.push(idx);
      idx += cmds.length;
    }
    return offsets;
  }, [grouped]);

  // Scroll selected item into view
  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-command-palette]')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || flatCommands.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((prev) =>
            prev < flatCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          onSelect(flatCommands[selectedIndex]);
          break;
        case 'Tab':
          e.preventDefault();
          e.stopPropagation();
          onSelect(flatCommands[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    },
    [isOpen, flatCommands, selectedIndex, onSelect, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);

  // Notify parent about currently selected command for inline hint
  useEffect(() => {
    if (onHover && flatCommands[selectedIndex]) {
      onHover(flatCommands[selectedIndex]);
    }
  }, [selectedIndex, flatCommands, onHover]);

  // Clear hover when closing
  useEffect(() => {
    if (!isOpen && onHover) {
      onHover(null);
    }
  }, [isOpen, onHover]);

  if (!isOpen || flatCommands.length === 0) return null;

  const categories = Object.keys(grouped) as CommandCategory[];
  const hoveredCommand = flatCommands[selectedIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-command-palette
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="absolute z-[100] w-full"
          style={{
            bottom: position.top,
            left: 0,
            width: position.width,
          }}
        >
          <div className="bg-[#1a1b26]/98 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-[#1a1b26]/90">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-[#E8710A] uppercase tracking-wider">
                  Commands
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 px-1.5 text-[9px] bg-[#E8710A]/10 text-[#E8710A]/70 border-[#E8710A]/20"
                >
                  {filteredCommands.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/20 font-mono text-[9px]">
                  <ArrowUpDown className="w-2.5 h-2.5" />
                  <span>nav</span>
                </kbd>
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/20 font-mono text-[9px]">
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  <span>run</span>
                </kbd>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/20 font-mono text-[9px]">
                  Tab
                </kbd>
                <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted/30 border border-border/20 font-mono text-[9px]">
                  Esc
                </kbd>
              </div>
            </div>

            {/* Command list */}
            <ScrollArea className="max-h-[300px]">
              <div ref={scrollRef} className="py-1 command-palette-scroll">
                {categories.map((category, catIdx) => {
                  const CatIcon = CATEGORY_ICONS[category];
                  const cmds = grouped[category];

                  return (
                    <div key={category}>
                      {/* Category header */}
                      <div className="flex items-center gap-1.5 px-3 py-1">
                        <CatIcon className="w-3 h-3 text-muted-foreground/30" />
                        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                          {category}
                        </span>
                        <span className="text-[9px] text-muted-foreground/30">
                          {cmds.length}
                        </span>
                      </div>

                      {/* Commands */}
                      {cmds.map((cmd, cmdIdx) => {
                        const globalIdx = categoryOffsets[catIdx] + cmdIdx;
                        const isSelected = globalIdx === selectedIndex;
                        const Icon = cmd.icon;

                        return (
                          <button
                            key={cmd.name}
                            ref={(el) => {
                              itemRefs.current[globalIdx] = el;
                            }}
                            className={`
                              w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-all duration-75
                              ${
                                isSelected
                                  ? 'bg-[#E8710A]/10'
                                  : 'text-foreground/70 hover:bg-muted/20'
                              }
                            `}
                            onClick={() => onSelect(cmd)}
                            onMouseEnter={() => {
                              setSelectedIndex(globalIdx);
                            }}
                          >
                            {/* Icon */}
                            <div
                              className={`
                                flex items-center justify-center h-6 w-6 rounded-md shrink-0 transition-all duration-75
                                ${
                                  isSelected
                                    ? 'bg-[#E8710A]/15 border border-[#E8710A]/30'
                                    : 'bg-muted/30 border border-transparent'
                                }
                              `}
                            >
                              <Icon
                                className={`w-3 h-3 transition-colors duration-75 ${
                                  isSelected
                                    ? 'text-[#E8710A]'
                                    : 'text-muted-foreground/50'
                                }`}
                              />
                            </div>

                            {/* Name */}
                            <div
                              className={`text-[13px] font-medium font-mono shrink-0 w-24 transition-colors duration-75 ${
                                isSelected
                                  ? 'text-[#E8710A]'
                                  : 'text-foreground/80'
                              }`}
                            >
                              /{cmd.name}
                            </div>

                            {/* Description */}
                            <div
                              className={`text-[11px] truncate transition-colors duration-75 ${
                                isSelected
                                  ? 'text-[#E8710A]/50'
                                  : 'text-muted-foreground/40'
                              }`}
                            >
                              {cmd.description}
                            </div>

                            {/* Right: shortcut & selector */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              {cmd.shortcut && (
                                <kbd className="hidden sm:inline-flex px-1 py-0.5 rounded bg-muted/20 border border-border/15 font-mono text-[8px] text-muted-foreground/30">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                              {isSelected && (
                                <ChevronRight className="w-3 h-3 text-[#E8710A]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Bottom: Selected command detail */}
            {hoveredCommand && (
              <div className="border-t border-border/30 px-3 py-2 bg-[#1a1b26]/90 flex items-center gap-3">
                <hoveredCommand.icon className="w-3.5 h-3.5 text-[#E8710A]/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-foreground/70 font-mono">
                    /{hoveredCommand.name}
                    {hoveredCommand.aliases.length > 0 && (
                      <span className="text-muted-foreground/30 font-normal ml-2">
                        ({hoveredCommand.aliases.map(a => `/${a}`).join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground/40 truncate">
                    {hoveredCommand.description}
                    {hoveredCommand.usage && ` — ${hoveredCommand.usage}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
