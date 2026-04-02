'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, X, Info, CheckCircle2, AlertTriangle, AlertCircle, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SystemMessageProps {
  content: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
}

const TYPE_STYLES: Record<
  SystemMessageProps['type'],
  {
    border: string;
    bg: string;
    icon: typeof Info;
    iconColor: string;
    label: string;
    labelColor: string;
  }
> = {
  info: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    icon: Info,
    iconColor: 'text-blue-400',
    label: 'INFO',
    labelColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  success: {
    border: 'border-green-500/30',
    bg: 'bg-green-500/5',
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    label: 'SUCCESS',
    labelColor: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  warning: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
    label: 'WARNING',
    labelColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  },
  error: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    icon: AlertCircle,
    iconColor: 'text-red-400',
    label: 'ERROR',
    labelColor: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  command: {
    border: 'border-[#E8710A]/30',
    bg: 'bg-[#E8710A]/5',
    icon: Terminal,
    iconColor: 'text-[#E8710A]',
    label: 'CMD',
    labelColor: 'text-[#E8710A] bg-[#E8710A]/10 border-[#E8710A]/20',
  },
};

const COLLAPSE_THRESHOLD = 8; // lines

export function SystemMessage({ content, type }: SystemMessageProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const contentRef = useRef<HTMLPreElement>(null);

  const style = TYPE_STYLES[type];
  const Icon = style.icon;

  const lineCount = content.split('\n').length;
  const shouldCollapse = lineCount > COLLAPSE_THRESHOLD;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
  }, [content]);

  if (isDismissed) return null;

  return (
    <div
      className={cn(
        'mx-4 sm:mx-6 my-2 rounded-xl border-l-2 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-1 duration-200',
        style.border,
        style.bg
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', style.iconColor)} />
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border',
              style.labelColor
            )}
          >
            {style.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {shouldCollapse && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3 h-3 mr-1" />
              ) : (
                <ChevronUp className="w-3 h-3 mr-1" />
              )}
              {isCollapsed ? 'Expand' : 'Collapse'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground"
            onClick={handleCopy}
          >
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-muted-foreground"
            onClick={() => setIsDismissed(true)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'transition-all duration-200 overflow-hidden',
          isCollapsed && shouldCollapse ? 'max-h-[180px]' : 'max-h-[600px]'
        )}
      >
        <pre
          ref={contentRef}
          className="px-4 pb-3 text-[12px] leading-relaxed font-mono text-foreground/70 whitespace-pre-wrap break-words overflow-y-auto max-h-[600px] system-message-content"
        >
          {shouldCollapse && isCollapsed
            ? content.split('\n').slice(0, COLLAPSE_THRESHOLD).join('\n') + '...'
            : content}
        </pre>
      </div>

      {/* Fade gradient for collapsed content */}
      {shouldCollapse && isCollapsed && (
        <div className="h-6 -mt-6 bg-gradient-to-t from-[#E8710A]/5 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
