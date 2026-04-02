// ─── Slash Command System ─────────────────────────────────────────────────────
// Complete command registry for the Claude Code Web chat interface.
// Defines all slash commands, their metadata, and lookup utilities.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Trash2,
  Copy,
  ClipboardPaste,
  HelpCircle,
  Activity,
  BarChart3,
  Cpu,
  Monitor,
  Palette,
  MessageSquare,
  Terminal,
  Settings,
  ZoomIn,
  FolderOpen,
  GitBranch,
  FileText,
  Search,
  Save,
  Undo2,
  Download,
  Info,
  PenLine,
  History,
  Zap,
  Brain,
  Lightbulb,
  FileSearch,
  GitCompare,
  BookOpen,
  Shield,
  Stethoscope,
  Rocket,
  ListTodo,
  Server,
  DollarSign,
  Keyboard,
  MonitorDot,
  LogIn,
  LogOut,
  Bug,
  MessageCircleCode,
  FilePenLine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommandCategory = 'General' | 'Session' | 'AI' | 'Settings' | 'Tools';

export interface CommandArg {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'enum';
  enumValues?: string[];
}

export interface SlashCommand {
  name: string;
  aliases: string[];
  description: string;
  usage?: string;
  category: CommandCategory;
  icon: LucideIcon;
  shortcut?: string;
  args?: CommandArg[];
  requiresArgs?: boolean;
  argsPlaceholder?: string;
  isClientOnly: boolean;
  isHidden?: boolean;
}

// ─── Command Definitions ─────────────────────────────────────────────────────

export const commands: SlashCommand[] = [
  // ── General ──────────────────────────────────────────────────────────────
  {
    name: 'help',
    aliases: ['h', '?'],
    description: 'Show all available commands grouped by category',
    category: 'General',
    icon: HelpCircle,
    shortcut: '?',
    isClientOnly: true,
  },
  {
    name: 'clear',
    aliases: ['cls', 'reset'],
    description: 'Clear the entire chat history',
    category: 'General',
    icon: Trash2,
    isClientOnly: true,
  },
  {
    name: 'undo',
    aliases: ['u'],
    description: 'Remove the last user + assistant exchange',
    category: 'General',
    icon: Undo2,
    isClientOnly: true,
  },
  {
    name: 'copy',
    aliases: ['cp'],
    description: 'Copy the last assistant response to clipboard',
    category: 'General',
    icon: Copy,
    isClientOnly: true,
  },
  {
    name: 'export',
    aliases: ['save', 'download'],
    description: 'Export the conversation as a Markdown file',
    category: 'General',
    icon: Download,
    isClientOnly: true,
  },
  {
    name: 'search',
    aliases: ['s', 'find', 'grep'],
    description: 'Search through the conversation history',
    usage: '/search <query>',
    category: 'General',
    icon: Search,
    args: [
      {
        name: 'query',
        description: 'The text to search for in messages',
        required: true,
        type: 'string',
      },
    ],
    isClientOnly: true,
  },

  // ── Session ──────────────────────────────────────────────────────────────
  {
    name: 'session',
    aliases: ['info', 'sess'],
    description: 'Show current session info (message count, duration, model)',
    category: 'Session',
    icon: Info,
    isClientOnly: true,
  },
  {
    name: 'stats',
    aliases: ['statistics'],
    description: 'Show detailed usage statistics (messages, tool calls, tokens)',
    category: 'Session',
    icon: BarChart3,
    isClientOnly: true,
  },
  {
    name: 'status',
    aliases: ['health', 'ping'],
    description: 'Show system status (model, API health, uptime)',
    category: 'Session',
    icon: Activity,
    isClientOnly: false,
  },
  {
    name: 'rename',
    aliases: ['title'],
    description: 'Rename the current session',
    usage: '/rename <name>',
    category: 'Session',
    icon: PenLine,
    requiresArgs: true,
    argsPlaceholder: 'session name',
    args: [
      {
        name: 'name',
        description: 'The new name for this session',
        required: true,
        type: 'string',
      },
    ],
    isClientOnly: true,
  },
  {
    name: 'resume',
    aliases: ['sessions', 'history'],
    description: 'List previous sessions saved in localStorage',
    category: 'Session',
    icon: History,
    isClientOnly: true,
  },

  // ── AI Modes ─────────────────────────────────────────────────────────────
  {
    name: 'model',
    aliases: ['models'],
    description: 'Show or cycle through available AI models',
    category: 'AI',
    icon: Cpu,
    isClientOnly: true,
  },
  {
    name: 'compact',
    aliases: ['summarize', 'compress'],
    description: 'Ask the AI to summarize and compress the conversation',
    category: 'AI',
    icon: ZoomIn,
    isClientOnly: false,
  },
  {
    name: 'fast',
    aliases: ['speed', 'turbo'],
    description: 'Toggle between fast and quality response mode',
    category: 'AI',
    icon: Zap,
    isClientOnly: true,
  },
  {
    name: 'effort',
    aliases: ['reasoning'],
    description: 'Set the AI reasoning effort level',
    usage: '/effort <low|medium|high>',
    category: 'AI',
    icon: Brain,
    requiresArgs: true,
    argsPlaceholder: 'low | medium | high',
    args: [
      {
        name: 'level',
        description: 'The reasoning effort level',
        required: true,
        type: 'enum',
        enumValues: ['low', 'medium', 'high'],
      },
    ],
    isClientOnly: true,
  },
  {
    name: 'plan',
    aliases: ['think', 'strategy'],
    description: 'Toggle plan mode (AI thinks first, then acts)',
    category: 'AI',
    icon: Lightbulb,
    isClientOnly: true,
  },
  {
    name: 'review',
    aliases: ['audit', 'analyze'],
    description: 'Ask the AI to review the current project or codebase',
    category: 'AI',
    icon: FileSearch,
    isClientOnly: false,
  },
  {
    name: 'diff',
    aliases: ['changes'],
    description: 'Ask the AI to show recent file changes in the project',
    category: 'AI',
    icon: GitCompare,
    isClientOnly: false,
  },

  // ── Settings ─────────────────────────────────────────────────────────────
  {
    name: 'config',
    aliases: ['settings', 'prefs'],
    description: 'Show current configuration settings',
    category: 'Settings',
    icon: Settings,
    isClientOnly: true,
  },
  {
    name: 'theme',
    aliases: ['themes', 'appearance'],
    description: 'Cycle through available themes (dark, light, terminal-green)',
    category: 'Settings',
    icon: Palette,
    isClientOnly: true,
  },
  {
    name: 'memory',
    aliases: ['context', 'claudemd'],
    description: 'Show or edit the project memory (CLAUDE.md)',
    category: 'Settings',
    icon: BookOpen,
    isClientOnly: false,
  },
  {
    name: 'permissions',
    aliases: ['perms', 'access'],
    description: 'Show the current permission level',
    category: 'Settings',
    icon: Shield,
    isClientOnly: true,
  },
  {
    name: 'doctor',
    aliases: ['diagnose', 'check'],
    description: 'Run health checks (API connectivity, tools)',
    category: 'Settings',
    icon: Stethoscope,
    isClientOnly: false,
  },
  {
    name: 'init',
    aliases: ['setup', 'initialize'],
    description: 'Initialize the project with a CLAUDE.md file',
    category: 'Settings',
    icon: Rocket,
    isClientOnly: false,
  },

  // ── Claude Code Native ─────────────────────────────────────────────────
  {
    name: 'vim',
    aliases: ['vi'],
    description: 'Show keyboard shortcuts and vim-like bindings info',
    category: 'Settings',
    icon: Keyboard,
    isClientOnly: true,
  },
  {
    name: 'terminal-setup',
    aliases: ['terminal', 'shell-setup'],
    description: 'Show terminal configuration and setup info',
    category: 'Settings',
    icon: MonitorDot,
    isClientOnly: true,
  },
  {
    name: 'edit',
    aliases: ['editor'],
    description: 'Show info about how file editing works in this interface',
    category: 'Settings',
    icon: FilePenLine,
    isClientOnly: true,
  },
  {
    name: 'login',
    aliases: ['auth'],
    description: 'Show authentication status and provider info',
    category: 'Settings',
    icon: LogIn,
    isClientOnly: true,
  },
  {
    name: 'logout',
    aliases: ['signout'],
    description: 'Show logout info (managed server-side)',
    category: 'Settings',
    icon: LogOut,
    isClientOnly: true,
  },
  {
    name: 'bug',
    aliases: ['report', 'issue'],
    description: 'Report a bug — AI will help diagnose and fix it',
    category: 'AI',
    icon: Bug,
    isClientOnly: false,
  },
  {
    name: 'pr-comments',
    aliases: ['pr', 'pull-request', 'code-review'],
    description: 'Ask AI to review current changes as a PR review',
    category: 'AI',
    icon: MessageCircleCode,
    isClientOnly: false,
  },
  {
    name: 'terminal-detect',
    aliases: ['term-detect', 'shell-info'],
    description: 'Show detected terminal environment info',
    category: 'Settings',
    icon: Monitor,
    isClientOnly: true,
  },

  // ── Tools ────────────────────────────────────────────────────────────────
  {
    name: 'tasks',
    aliases: ['todo', 'todos'],
    description: 'Show the todo list extracted from conversation',
    category: 'Tools',
    icon: ListTodo,
    isClientOnly: true,
  },
  {
    name: 'mcp',
    aliases: ['servers', 'tools-list'],
    description: 'Show available MCP servers and tools',
    category: 'Tools',
    icon: Server,
    isClientOnly: true,
  },
  {
    name: 'cost',
    aliases: ['tokens', 'usage'],
    description: 'Show estimated token costs for the session',
    category: 'Tools',
    icon: DollarSign,
    isClientOnly: true,
  },
];

// ─── Legacy aliases for backward compatibility ───────────────────────────────
// These exports match the old API consumed by CommandPalette.tsx

/** @deprecated Use `commands` instead. Kept for backward compatibility. */
export const COMMANDS = commands;

/** @deprecated Use `categoryLabels` instead. Kept for backward compatibility. */
export const AVAILABLE_MODELS = [
  { id: 'deepseek-ai/deepseek-v3.1', name: 'DeepSeek V3.1', description: 'Best for coding tasks', default: true },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'General purpose model', default: false },
  { id: 'mistralai/mistral-large-2-instruct', name: 'Mistral Large 2', description: 'Fast responses', default: false },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct', name: 'Nemotron 70B', description: 'NVIDIA optimized', default: false },
] as const;

export type ModelInfo = (typeof AVAILABLE_MODELS)[number];

// ─── Category Icons ──────────────────────────────────────────────────────────

export const CATEGORY_ICONS: Record<CommandCategory, LucideIcon> = {
  General: HelpCircle,
  Session: MessageSquare,
  AI: Cpu,
  Settings: Settings,
  Tools: Terminal,
};

export const categoryLabels: Record<CommandCategory, string> = {
  General: '📝 General',
  Session: '💬 Session',
  AI: '🤖 AI Modes',
  Settings: '⚙️ Settings',
  Tools: '🔧 Tools',
};

// ─── Lookup Utilities ────────────────────────────────────────────────────────

/**
 * Find a slash command by name or alias.
 * Input is case-insensitive and can optionally start with `/`.
 */
export function findCommand(input: string): SlashCommand | null {
  const normalized = input.trim().toLowerCase().replace(/^\//, '');

  return (
    commands.find(
      (cmd) =>
        cmd.name === normalized ||
        cmd.aliases.some((alias) => alias === normalized)
    ) ?? null
  );
}

/**
 * Parse a raw user input string into a command name and its arguments.
 * Returns null if the input doesn't start with `/` or has no command name.
 */
export function parseCommand(input: string): {
  command: string;
  args: string;
} | null {
  const trimmed = input.trim();

  if (!trimmed.startsWith('/')) {
    return null;
  }

  // Strip the leading `/` and split on whitespace
  const withoutSlash = trimmed.slice(1);
  const spaceIndex = withoutSlash.search(/\s/);

  if (spaceIndex === -1) {
    return { command: withoutSlash.toLowerCase(), args: '' };
  }

  return {
    command: withoutSlash.slice(0, spaceIndex).toLowerCase(),
    args: withoutSlash.slice(spaceIndex + 1).trim(),
  };
}

/**
 * Group commands by their category. Accepts an optional list of commands
 * (e.g. filtered) — defaults to all visible commands.
 */
export function getCommandsByCategory(
  commandList?: SlashCommand[]
): Record<string, SlashCommand[]> {
  const source = commandList ?? commands.filter((cmd) => !cmd.isHidden);

  const grouped: Record<string, SlashCommand[]> = {};

  for (const cmd of source) {
    if (cmd.isHidden && !commandList) continue;
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = [];
    }
    grouped[cmd.category].push(cmd);
  }

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(grouped).filter(([, cmds]) => cmds.length > 0)
  );
}

/**
 * Fuzzy search commands by name, alias, or description.
 */
export function searchCommands(query: string): SlashCommand[] {
  const q = query.toLowerCase().trim();

  if (!q) return commands.filter((cmd) => !cmd.isHidden);

  return commands.filter((cmd) => {
    if (cmd.isHidden) return false;

    const haystack = [
      cmd.name,
      ...cmd.aliases,
      cmd.description,
      cmd.category,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

/**
 * Find command by exact name (case-insensitive).
 */
export function getCommandByName(name: string): SlashCommand | undefined {
  return commands.find((cmd) => cmd.name === name.toLowerCase());
}

/**
 * Generate a plain-text help string.
 */
export function generateHelpText(): string {
  let help = 'Available Commands:\n\n';
  const grouped = getCommandsByCategory();

  for (const [category, cmds] of Object.entries(grouped)) {
    help += `  ${category}\n`;
    help += `  ${'─'.repeat(category.length)}\n`;
    for (const cmd of cmds) {
      const alias = cmd.shortcut ? ` (${cmd.shortcut})` : '';
      const aliasLen = cmd.aliases.length > 0 ? ` [${cmd.aliases.join(', ')}]` : '';
      help += `  /${cmd.name}${alias}${aliasLen.padEnd(Math.max(0, 20 - cmd.name.length - alias.length - aliasLen.length))} ${cmd.description}\n`;
    }
    help += '\n';
  }

  help += '  Tips:\n';
  help += '  • Type / to see all commands\n';
  help += '  • Use Tab to autocomplete commands\n';
  help += '  • Use ↑↓ to navigate, Enter to select\n';

  return help;
}

// ─── Available Models ────────────────────────────────────────────────────────

export const availableModels = [
  'deepseek-ai/deepseek-v3.1',
  'meta/llama-3.1-70b-instruct',
  'mistralai/mistral-large-2-instruct',
  'nvidia/llama-3.1-nemotron-70b-instruct',
] as const;

export const modelDisplayNames: Record<string, string> = {
  'deepseek-ai/deepseek-v3.1': 'DeepSeek V3.1',
  'meta/llama-3.1-70b-instruct': 'Llama 3.1 70B',
  'mistralai/mistral-large-2-instruct': 'Mistral Large 2',
  'nvidia/llama-3.1-nemotron-70b-instruct': 'Nemotron 70B',
};

export const availableThemes = ['dark', 'light', 'terminal-green'] as const;
export type ThemeOption = (typeof availableThemes)[number];
