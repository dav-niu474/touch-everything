'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  FileSearch,
  FileText,
  Search,
  Globe,
  FolderOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
  LucideProps,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ToolCall } from '@/store/chat-store';

interface ToolCallBlockProps {
  toolCall: ToolCall;
}

function getToolIconName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('bash') || lower.includes('terminal') || lower.includes('exec') || lower.includes('command')) {
    return 'terminal';
  }
  if (lower.includes('grep') || lower.includes('search') || lower.includes('find')) {
    return 'search';
  }
  if (lower.includes('glob') || lower.includes('file') || lower.includes('read') || lower.includes('write')) {
    return 'file';
  }
  if (lower.includes('browse') || lower.includes('web') || lower.includes('fetch') || lower.includes('http')) {
    return 'globe';
  }
  if (lower.includes('list') || lower.includes('dir') || lower.includes('folder')) {
    return 'folder';
  }
  if (lower.includes('edit') || lower.includes('modify') || lower.includes('replace')) {
    return 'edit';
  }
  return 'wrench';
}

function ToolIcon({ name }: { name: string }) {
  const iconType = getToolIconName(name);
  const colorClass = {
    terminal: 'text-green-400',
    search: 'text-blue-400',
    file: 'text-amber-400',
    globe: 'text-purple-400',
    edit: 'text-cyan-400',
    folder: 'text-amber-400',
    wrench: 'text-muted-foreground',
  }[iconType] || 'text-muted-foreground';

  const iconProps: LucideProps = { className: `h-4 w-4 ${colorClass} shrink-0` };

  switch (iconType) {
    case 'terminal':
      return <Terminal {...iconProps} />;
    case 'search':
      return <Search {...iconProps} />;
    case 'file':
      return <FileText {...iconProps} />;
    case 'globe':
      return <Globe {...iconProps} />;
    case 'folder':
      return <FolderOpen {...iconProps} />;
    case 'edit':
      return <FileSearch {...iconProps} />;
    default:
      return <Wrench {...iconProps} />;
  }
}

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />;
    case 'completed':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />;
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-red-400" />;
    default:
      return null;
  }
}

function formatArguments(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => {
      const val = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      return `${key}: ${val}`;
    })
    .join('\n');
}

export function ToolCallBlock({ toolCall }: ToolCallBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isRunning = toolCall.status === 'running';

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="my-2 rounded-lg border border-border/50 bg-[#16161e]/80 overflow-hidden"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/30 transition-colors">
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <ToolIcon name={toolCall.name} />
        <span className="font-mono text-xs font-medium text-foreground/80 flex-1 text-left truncate">
          {toolCall.name}
        </span>
        {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden sm:inline">
            {Object.values(toolCall.arguments).join(', ').slice(0, 50)}
          </span>
        )}
        <StatusIcon status={toolCall.status} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border/30">
          {/* Arguments */}
          {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
            <div className="px-3 py-2 bg-[#1a1b26]/50">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                Arguments
              </div>
              <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-all">
                {formatArguments(toolCall.arguments)}
              </pre>
            </div>
          )}
          {/* Result */}
          {toolCall.result && (
            <div className="px-3 py-2 bg-[#1a1b26]/30 border-t border-border/20">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">
                Result
                {toolCall.status === 'error' && (
                  <span className="text-red-400">(error)</span>
                )}
              </div>
              <pre
                className={`text-xs font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto chat-scrollbar ${
                  toolCall.status === 'error'
                    ? 'text-red-300'
                    : 'text-foreground/60'
                }`}
              >
                {toolCall.result}
              </pre>
            </div>
          )}
          {/* Running indicator */}
          {isRunning && !toolCall.result && (
            <div className="px-3 py-3 bg-[#1a1b26]/30 border-t border-border/20 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              <span className="text-xs text-muted-foreground">Running...</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
