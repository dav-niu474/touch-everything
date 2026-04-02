'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Check, CornerDownLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AVAILABLE_MODELS, type ModelInfo } from '@/lib/commands';

interface ModelSelectorProps {
  isOpen: boolean;
  currentModel: string;
  position: { top: number; left: number; width: number };
  onSelect: (model: ModelInfo) => void;
  onClose: () => void;
}

export function ModelSelector({
  isOpen,
  currentModel,
  position,
  onSelect,
  onClose,
}: ModelSelectorProps) {
  const [prevModel, setPrevModel] = useState(currentModel);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync selected index to current model (React-recommended render-time adjustment)
  if (prevModel !== currentModel) {
    setPrevModel(currentModel);
    const idx = AVAILABLE_MODELS.findIndex((m) => m.id === currentModel);
    if (idx !== -1) setSelectedIndex(idx);
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < AVAILABLE_MODELS.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : AVAILABLE_MODELS.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          onSelect(AVAILABLE_MODELS[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedIndex, onSelect, onClose]);

  // Scroll selected into view
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-model-idx="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-model-selector]')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    (model: ModelInfo) => {
      onSelect(model);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-model-selector
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute z-[100] w-full"
          style={{
            bottom: position.top,
            left: 0,
            width: position.width,
          }}
        >
          <div className="bg-[#1a1b26]/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 bg-[#1a1b26]/80">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-[#E8710A]" />
                <span className="text-xs font-semibold text-foreground/90">
                  Select Model
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                <kbd className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono text-[9px]">
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  select
                </kbd>
                <kbd className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-muted/40 border border-border/30 font-mono text-[9px]">
                  Esc
                </kbd>
              </div>
            </div>

            {/* Model list */}
            <div ref={scrollRef} className="max-h-[280px] overflow-y-auto py-1.5 model-selector-scroll">
              {AVAILABLE_MODELS.map((model, idx) => {
                const isSelected = idx === selectedIndex;
                const isCurrent = model.id === currentModel;

                return (
                  <button
                    key={model.id}
                    data-model-idx={idx}
                    className={`
                      w-full flex items-start gap-3 px-3 py-3 text-left transition-colors duration-75
                      ${
                        isSelected
                          ? 'bg-[#E8710A]/10'
                          : 'hover:bg-muted/30'
                      }
                    `}
                    onClick={() => handleSelect(model)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    {/* Radio indicator */}
                    <div className="flex items-center justify-center mt-0.5">
                      <div
                        className={`
                          w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center
                          ${
                            isCurrent
                              ? 'border-[#E8710A] bg-[#E8710A]'
                              : isSelected
                                ? 'border-[#E8710A]/60'
                                : 'border-muted-foreground/30'
                          }
                        `}
                      >
                        {isCurrent && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>

                    {/* Model info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isSelected
                              ? 'text-[#E8710A]'
                              : isCurrent
                                ? 'text-foreground/90'
                                : 'text-foreground/70'
                          }`}
                        >
                          {model.name}
                        </span>
                        {model.default && (
                          <Badge
                            className="h-4 px-1.5 text-[9px] bg-[#E8710A]/10 text-[#E8710A] border-[#E8710A]/20 hover:bg-[#E8710A]/15"
                          >
                            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                            default
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[9px] bg-green-500/10 text-green-400 border-green-500/20"
                          >
                            active
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground/50 mt-0.5 font-mono truncate">
                        {model.id}
                      </div>
                      <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                        {model.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-border/30 bg-[#1a1b26]/60">
              <p className="text-[10px] text-muted-foreground/40 text-center">
                Changing model will start a new conversation context
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
