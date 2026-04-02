// ─── Command Handlers ────────────────────────────────────────────────────────
// Execution engine for all slash commands. Each handler is a pure function that
// returns a CommandResult describing what the caller should do (display a message,
// perform an action, or send an AI message).
// ─────────────────────────────────────────────────────────────────────────────

import type { Message } from '@/store/chat-store';
import {
  commands,
  getCommandsByCategory,
  categoryLabels,
  availableModels,
  modelDisplayNames,
  type SlashCommand,
} from '@/lib/commands';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommandResultType =
  | 'message'     // Display text to the user as a system message
  | 'action'      // Trigger a side-effect (clear chat, download, toggle, etc.)
  | 'ai-message'  // Send a prompt to the AI on the user's behalf
  | 'silent';     // No visible output

export interface CommandResult {
  type: CommandResultType;
  content?: string;
  action?: {
    type: string;
    value?: unknown;
  };
}

// ─── State Snapshot ──────────────────────────────────────────────────────────

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentModel: string;
  theme: string;
  sessionName: string | null;
  planMode: boolean;
  fastMode: boolean;
  effort: string;
  sessionStartTime: number;
  [key: string]: unknown;
}

// ─── Main Executor ───────────────────────────────────────────────────────────

/**
 * Execute a slash command by name and return the result.
 * The caller (usually a React component) inspects the result type and acts accordingly.
 */
export async function executeCommand(
  commandName: string,
  args: string,
  state: ChatState
): Promise<CommandResult> {
  switch (commandName) {
    // ── General ───────────────────────────────────────────────────────────
    case 'help':
      return handleHelp();

    case 'clear':
      return { type: 'action', action: { type: 'clear' } };

    case 'undo':
      return handleUndo(state.messages);

    case 'copy':
      return handleCopy(state.messages);

    case 'export':
      return handleExport(state.messages);

    case 'search':
      return handleSearch(state.messages, args);

    // ── Session ───────────────────────────────────────────────────────────
    case 'session':
      return handleSession(state);

    case 'stats':
      return handleStats(state.messages);

    case 'status':
      return handleStatus(state);

    case 'rename':
      return {
        type: 'action',
        action: { type: 'rename', value: args },
      };

    case 'resume':
      return handleResume();

    // ── AI Modes ──────────────────────────────────────────────────────────
    case 'model':
      return handleModel(args);

    case 'compact':
      return {
        type: 'ai-message',
        content:
          'Summarize our entire conversation so far into a concise summary. Preserve key decisions, code snippets, and action items. Format as a brief but comprehensive summary.',
      };

    case 'fast':
      return { type: 'action', action: { type: 'toggle-fast' } };

    case 'effort':
      return handleEffort(args);

    case 'plan':
      return { type: 'action', action: { type: 'toggle-plan' } };

    case 'review':
      return {
        type: 'ai-message',
        content:
          'Please review the current project. Analyze the codebase structure, identify potential issues, code smells, or security concerns, and suggest improvements. Be thorough and specific.',
      };

    case 'diff':
      return {
        type: 'ai-message',
        content:
          'Show me the recent file changes in the project. Use git to list modified and newly created files, and show the diffs for the most important changes.',
      };

    // ── Settings ──────────────────────────────────────────────────────────
    case 'config':
      return handleConfig(state);

    case 'theme':
      return { type: 'action', action: { type: 'toggle-theme' } };

    case 'memory':
      return {
        type: 'ai-message',
        content:
          'Show the current project memory. If there is a CLAUDE.md file in the project root, read and display its contents. If not, suggest creating one with useful project guidelines.',
      };

    case 'permissions':
      return handlePermissions();

    case 'doctor':
      return {
        type: 'ai-message',
        content:
          'Please run a diagnostic check on the project: verify the project structure, check if key config files exist (package.json, tsconfig.json, etc.), test the development setup, and identify any issues.',
      };

    case 'init':
      return {
        type: 'ai-message',
        content:
          'Analyze the project structure (package.json, directory layout, key files) and create a CLAUDE.md file in the project root with useful guidelines including: project description, tech stack, coding conventions, common commands, and architecture notes.',
      };

    case 'vim':
      return handleVim();

    case 'terminal-setup':
      return {
        type: 'message',
        content:
          '### 🖥️ Terminal Setup\n\n' +
          'This web interface uses an embedded terminal for AI tool execution.\n\n' +
          '- **Working Directory:** `/home/z/my-project`\n' +
          '- **Available Tools:** bash, file_read, file_write, file_edit, glob_search, grep_search\n' +
          '- **Shell:** `/bin/sh`\n' +
          '- **Timeout:** 30s per command\n\n' +
          '> Terminal setup is managed by the server. No additional configuration needed.',
      };

    case 'edit':
      return handleEdit(state);

    case 'login':
      return {
        type: 'message',
        content:
          '### 🔑 Authentication\n\n' +
          'This Claude Code Web instance is already authenticated.\n\n' +
          '- **Provider:** NVIDIA NIM\n' +
          '- **Status:** ✅ Connected\n' +
          '- **Model:** ' + (modelDisplayNames[state.currentModel] || state.currentModel) + '\n\n' +
          '> Web interface does not require separate login. API credentials are managed server-side.',
      };

    case 'logout':
      return {
        type: 'message',
        content:
          '### 🔓 Logout\n\n' +
          'This web interface does not support logout since authentication is managed server-side.\n\n' +
          '> To revoke access, contact the server administrator.',
      };

    case 'bug':
      return {
        type: 'ai-message',
        content:
          'I need to report a bug. Here is the issue:\n\nPlease help me identify the root cause and suggest a fix. Use available tools to examine the codebase if needed.',
      };

    case 'pr-comments':
      return {
        type: 'ai-message',
        content:
          'Please review the current changes as if reviewing a pull request. Focus on: code quality, potential bugs, performance issues, security concerns, and adherence to best practices. Use available tools to read relevant files.',
      };

    case 'terminal-detect':
      return {
        type: 'message',
        content:
          '### 🖥️ Terminal Detection\n\n' +
          '- **Environment:** Web Browser\n' +
          '- **Shell:** Server-side (bash)\n' +
          '- **Terminal:** Claude Code Web Interface\n' +
          '- **Color Support:** 256-color (via CSS)\n' +
          '- **Unicode Support:** ✅ Full\n' +
          '- **Working Directory:** `/home/z/my-project`',
      };

    // ── Tools ─────────────────────────────────────────────────────────────
    case 'tasks':
      return handleTasks(state.messages);

    case 'mcp':
      return handleMcp();

    case 'cost':
      return handleCost(state.messages);

    default:
      return {
        type: 'message',
        content: `Unknown command: /${commandName}. Type /help to see available commands.`,
      };
  }
}

// ─── Helper: format command row ──────────────────────────────────────────────

function formatCmd(cmd: SlashCommand): string {
  const aliases = cmd.aliases.length > 0 ? ` (${cmd.aliases.map((a) => `/${a}`).join(', ')})` : '';
  const usage = cmd.usage ? ` — *Usage:* \`${cmd.usage}\`` : '';
  const args = cmd.args
    ?.map((a) => {
      const label = a.required ? `<${a.name}>` : `[${a.name}]`;
      const values = a.type === 'enum' ? `: ${a.enumValues?.join('|')}` : '';
      return `\`${label}${values}\` — ${a.description}`;
    })
    .join('\n    ');
  const argsBlock = args ? `\n    ${args}` : '';
  return `  **/${cmd.name}**${aliases} — ${cmd.description}${usage}${argsBlock}`;
}

// ─── Handler Implementations ─────────────────────────────────────────────────

function handleHelp(): CommandResult {
  const grouped = getCommandsByCategory();

  const sections = Object.entries(grouped)
    .map(([category, cmds]) => {
      const label = categoryLabels[category as keyof typeof categoryLabels] ?? category;
      const cmdList = cmds.map(formatCmd).join('\n');
      return `### ${label}\n${cmdList}`;
    })
    .join('\n\n');

  return {
    type: 'message',
    content:
      `# 📖 Command Reference\n\n${sections}\n\n---\n*Tip: You can also search commands by typing / followed by a keyword.*`,
  };
}

function handleUndo(messages: Message[]): CommandResult {
  if (messages.length === 0) {
    return { type: 'message', content: 'Nothing to undo — the chat is empty.' };
  }

  const lastUserIdx = messages.findLastIndex((m) => m.role === 'user');
  if (lastUserIdx === -1) {
    return { type: 'message', content: 'No user messages to undo.' };
  }

  let removeCount = 1;
  if (lastUserIdx + 1 < messages.length && messages[lastUserIdx + 1].role === 'assistant') {
    removeCount = 2;
  }

  return {
    type: 'action',
    action: {
      type: 'undo',
      value: { removeCount, removeFromIndex: lastUserIdx },
    },
  };
}

function handleCopy(messages: Message[]): CommandResult {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.content);

  if (!lastAssistant) {
    return { type: 'message', content: 'No assistant response to copy.' };
  }

  return {
    type: 'action',
    action: { type: 'copy', value: lastAssistant.content },
  };
}

function handleExport(messages: Message[]): CommandResult {
  if (messages.length === 0) {
    return { type: 'message', content: 'No messages to export.' };
  }

  const now = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `claude-code-export-${now}.md`;

  const lines: string[] = [
    `# Claude Code — Conversation Export`,
    `*Exported: ${new Date().toLocaleString()}*`,
    `*Messages: ${messages.length}*`,
    '',
    '---',
    '',
  ];

  for (const msg of messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    if (msg.role === 'user') {
      lines.push(`## 👤 User (${time})`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');
    } else if (msg.role === 'assistant') {
      lines.push(`## 🤖 Assistant (${time})`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');

      if (msg.toolCalls && msg.toolCalls.length > 0) {
        lines.push('**Tool Calls:**');
        lines.push('');
        for (const tc of msg.toolCalls) {
          const statusIcon = tc.status === 'completed' ? '✅' : tc.status === 'error' ? '❌' : '⏳';
          lines.push(`- ${statusIcon} **${tc.name}**(${JSON.stringify(tc.arguments)})`);
          if (tc.result) {
            lines.push(`  - Result: \`${tc.result.slice(0, 200)}${tc.result.length > 200 ? '…' : ''}\``);
          }
        }
        lines.push('');
      }
    }
  }

  const markdown = lines.join('\n');

  return {
    type: 'action',
    action: { type: 'download-file', value: { filename, content: markdown } },
  };
}

function handleSearch(messages: Message[], query: string): CommandResult {
  if (!query.trim()) {
    return { type: 'message', content: 'Please provide a search query. Usage: `/search <query>`' };
  }

  const q = query.toLowerCase();
  const results: string[] = [];

  for (const msg of messages) {
    if (msg.content.toLowerCase().includes(q)) {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const role = msg.role === 'user' ? '👤' : '🤖';
      const idx = msg.content.toLowerCase().indexOf(q);
      const start = Math.max(0, idx - 60);
      const end = Math.min(msg.content.length, idx + q.length + 60);
      const snippet =
        (start > 0 ? '…' : '') +
        msg.content.slice(start, end).replace(/\n/g, ' ') +
        (end < msg.content.length ? '…' : '');

      results.push(`- ${role} **[${time}]** ${snippet}`);
    }
  }

  if (results.length === 0) {
    return { type: 'message', content: `No messages found matching "${query}".` };
  }

  return {
    type: 'message',
    content: `### 🔍 Search Results for "${query}"\n\nFound ${results.length} matching message(s):\n\n${results.join('\n')}`,
  };
}

function handleSession(state: ChatState): CommandResult {
  const { messages } = state;
  const userMsgCount = messages.filter((m: Message) => m.role === 'user').length;
  const assistantMsgCount = messages.filter((m: Message) => m.role === 'assistant').length;
  const toolCallCount = messages.reduce(
    (acc: number, m: Message) => acc + (m.toolCalls?.length ?? 0),
    0
  );

  const duration = state.sessionStartTime
    ? formatDuration(Date.now() - state.sessionStartTime)
    : 'unknown';

  const currentModel = modelDisplayNames[state.currentModel] ?? state.currentModel ?? 'unknown';

  return {
    type: 'message',
    content:
      `### 💬 Session Info\n\n` +
      `- **Messages:** ${userMsgCount} user, ${assistantMsgCount} assistant\n` +
      `- **Tool Calls:** ${toolCallCount}\n` +
      `- **Duration:** ${duration}\n` +
      `- **Model:** ${currentModel}` +
      (state.sessionName ? `\n- **Name:** ${state.sessionName}` : ''),
  };
}

function handleStats(messages: Message[]): CommandResult {
  const userMsgs = messages.filter((m) => m.role === 'user');
  const assistantMsgs = messages.filter((m) => m.role === 'assistant');

  const totalToolCalls = assistantMsgs.reduce(
    (acc, m) => acc + (m.toolCalls?.length ?? 0),
    0
  );

  const completedTools = assistantMsgs.reduce(
    (acc, m) =>
      acc + (m.toolCalls?.filter((tc) => tc.status === 'completed').length ?? 0),
    0
  );

  const failedTools = assistantMsgs.reduce(
    (acc, m) =>
      acc + (m.toolCalls?.filter((tc) => tc.status === 'error').length ?? 0),
    0
  );

  const totalChars = messages.reduce((acc, m) => acc + m.content.length, 0);
  const estimatedTokens = Math.round(totalChars * 0.3);

  const toolNames = new Set<string>();
  for (const m of assistantMsgs) {
    m.toolCalls?.forEach((tc) => toolNames.add(tc.name));
  }

  return {
    type: 'message',
    content:
      `### 📊 Usage Statistics\n\n` +
      `- **User Messages:** ${userMsgs.length}\n` +
      `- **Assistant Messages:** ${assistantMsgs.length}\n` +
      `- **Total Tool Calls:** ${totalToolCalls} (${completedTools} completed, ${failedTools} failed)\n` +
      `- **Tools Used:** ${toolNames.size > 0 ? [...toolNames].join(', ') : 'none'}\n` +
      `- **Estimated Tokens:** ~${estimatedTokens.toLocaleString()} (${totalChars.toLocaleString()} chars)\n` +
      `- **Avg Message Length:** ${userMsgs.length > 0 ? Math.round(totalChars / userMsgs.length) : 0} chars`,
  };
}

async function handleStatus(state: ChatState): Promise<CommandResult> {
  let apiStatus = '❌ Unreachable';
  let apiLatency = '—';
  let apiModel = '—';

  try {
    const start = performance.now();
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
    const elapsed = Math.round(performance.now() - start);
    const data = await res.json();

    if (res.ok) {
      apiStatus = '✅ Connected';
      apiLatency = `${elapsed}ms`;
      apiModel = data.model ?? 'unknown';
    }
  } catch {
    apiStatus = '❌ Unreachable';
  }

  const planMode = state.planMode ? '🟢 On' : '⚪ Off';
  const fastMode = state.fastMode ? '🟢 On' : '⚪ Off';
  const effort = state.effort ?? 'medium';

  return {
    type: 'message',
    content:
      `### ⚡ System Status\n\n` +
      `- **API:** ${apiStatus} (latency: ${apiLatency})\n` +
      `- **Model:** ${apiModel}\n` +
      `- **Plan Mode:** ${planMode}\n` +
      `- **Fast Mode:** ${fastMode}\n` +
      `- **Effort Level:** ${effort}`,
  };
}

function handleModel(args: string): CommandResult {
  if (args.trim()) {
    const normalized = args.trim().toLowerCase();
    const found = availableModels.find(
      (m) => m.toLowerCase().includes(normalized) || modelDisplayNames[m].toLowerCase().includes(normalized)
    );
    if (found) {
      return {
        type: 'action',
        action: { type: 'set-model', value: found },
      };
    }
    return {
      type: 'message',
      content:
        `Model not found. Available models:\n${availableModels.map((m) => `- **${modelDisplayNames[m]}** (\`${m}\`)`).join('\n')}`,
    };
  }

  return {
    type: 'action',
    action: { type: 'cycle-model' },
  };
}

function handleEffort(args: string): CommandResult {
  const normalized = args.trim().toLowerCase();

  if (!['low', 'medium', 'high'].includes(normalized)) {
    return {
      type: 'message',
      content:
        'Invalid effort level. Please use one of: `low`, `medium`, `high`.\n\n' +
        '- **low** — Quick, less detailed responses\n' +
        '- **medium** — Balanced (default)\n' +
        '- **high** — Thorough, detailed responses',
    };
  }

  return {
    type: 'action',
    action: { type: 'set-effort', value: normalized },
  };
}

function handleConfig(state: ChatState): CommandResult {
  const currentModel = state.currentModel ?? 'unknown';
  const displayName = modelDisplayNames[currentModel] ?? currentModel;

  return {
    type: 'message',
    content:
      `### ⚙️ Current Configuration\n\n` +
      `- **Model:** ${displayName} (\`${currentModel}\`)\n` +
      `- **Plan Mode:** ${state.planMode ? 'Enabled' : 'Disabled'}\n` +
      `- **Fast Mode:** ${state.fastMode ? 'Enabled' : 'Disabled'}\n` +
      `- **Effort Level:** ${state.effort ?? 'medium'}\n` +
      `- **Theme:** ${state.theme ?? 'dark'}\n` +
      `- **Session Name:** ${state.sessionName ?? 'unnamed'}\n` +
      `- **Total Commands:** ${commands.length}`,
  };
}

function handlePermissions(): CommandResult {
  return {
    type: 'message',
    content:
      `### 🛡️ Permissions\n\n` +
      `- **File Read:** ✅ Allowed\n` +
      `- **File Write:** ✅ Allowed\n` +
      `- **File Edit:** ✅ Allowed\n` +
      `- **Bash Execution:** ✅ Allowed\n` +
      `- **Search (glob/grep):** ✅ Allowed\n\n` +
      `> All tools are available in this web interface. Permission restrictions are not enforced for this session.`,
  };
}

function handleVim(): CommandResult {
  return {
    type: 'message',
    content:
      '### ⌨️ Vim Mode\n\n' +
      'Vim keybindings are not available in this web interface.\n\n' +
      '**Available keyboard shortcuts:**\n' +
      '- **Enter** — Send message\n' +
      '- **Shift+Enter** — New line\n' +
      '- **/** — Open command palette\n' +
      '- **↑/↓** — Navigate command palette\n' +
      '- **Tab** — Autocomplete command\n' +
      '- **Esc** — Close palette / Cancel',
  };
}

function handleEdit(state: ChatState): CommandResult {
  return {
    type: 'message',
    content:
      '### ✏️ Edit Mode\n\n' +
      'In Claude Code Web, the AI assistant handles all file editing through tools.\n\n' +
      '**How to edit files:**\n' +
      '1. Ask the AI to edit a file (e.g., "Edit src/app/page.tsx and change the title")\n' +
      '2. The AI will use the `file_edit` tool to make precise changes\n' +
      '3. You can also ask the AI to create new files with `file_write`\n\n' +
      '**Available editing tools:**\n' +
      '- `file_read` — Read file contents\n' +
      '- `file_write` — Create or overwrite files\n' +
      '- `file_edit` — Find-and-replace edits\n\n' +
      `**Current session messages:** ${state.messages.length}`,
  };
}

function handleTasks(messages: Message[]): CommandResult {
  const allContent = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n');

  const taskPatterns = [
    /(?:TODO|FIXME|TASK|ACTION ITEM)[:\s]+(.+)/gi,
    /[-•]\s+\[[ x]\]\s+(.+)/gi,
    /(?:1\.\s+|2\.\s+|3\.\s+|4\.\s+|5\.\s+)(.+)/gi,
  ];

  const tasks: string[] = [];
  for (const pattern of taskPatterns) {
    let match;
    while ((match = pattern.exec(allContent)) !== null) {
      const task = match[1].trim();
      if (task.length > 0 && task.length < 200 && !tasks.includes(task)) {
        tasks.push(task);
      }
    }
  }

  if (tasks.length === 0) {
    return {
      type: 'message',
      content:
        '### 📋 Tasks\n\nNo tasks or action items found in the conversation.\n\n' +
        '> Tip: Ask the AI to create a todo list, or use numbered lists / `[ ]` checkboxes.',
    };
  }

  const taskList = tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');

  return {
    type: 'message',
    content: `### 📋 Tasks (${tasks.length} found)\n\n${taskList}`,
  };
}

function handleMcp(): CommandResult {
  return {
    type: 'message',
    content:
      `### 🖥️ Available Tools\n\n` +
      `| Tool | Description | Status |\n` +
      `|------|-------------|--------|\n` +
      `| \`bash\` | Execute shell commands | ✅ Active |\n` +
      `| \`file_read\` | Read file contents | ✅ Active |\n` +
      `| \`file_write\` | Create or overwrite files | ✅ Active |\n` +
      `| \`file_edit\` | Find-and-replace edits | ✅ Active |\n` +
      `| \`glob_search\` | Search files by name pattern | ✅ Active |\n` +
      `| \`grep_search\` | Search file contents with regex | ✅ Active |\n\n` +
      `> These tools are built-in and always available. No external MCP servers configured.`,
  };
}

function handleCost(messages: Message[]): CommandResult {
  let inputChars = 0;
  let outputChars = 0;

  for (const msg of messages) {
    if (msg.role === 'user') {
      inputChars += msg.content.length;
    } else if (msg.role === 'assistant') {
      outputChars += msg.content.length;
      msg.toolCalls?.forEach((tc) => {
        outputChars += JSON.stringify(tc.arguments).length;
      });
    }
  }

  const inputTokens = Math.round(inputChars * 0.3);
  const outputTokens = Math.round(outputChars * 0.3);
  const totalTokens = inputTokens + outputTokens;

  const inputCostPerM = 0.14;
  const outputCostPerM = 0.28;
  const estimatedCost = (inputTokens / 1_000_000) * inputCostPerM + (outputTokens / 1_000_000) * outputCostPerM;

  return {
    type: 'message',
    content:
      `### 💰 Estimated Token Costs\n\n` +
      `- **Input Tokens:** ~${inputTokens.toLocaleString()} (${inputChars.toLocaleString()} chars)\n` +
      `- **Output Tokens:** ~${outputTokens.toLocaleString()} (${outputChars.toLocaleString()} chars)\n` +
      `- **Total Tokens:** ~${totalTokens.toLocaleString()}\n` +
      `- **Estimated Cost:** ~$${estimatedCost.toFixed(4)}\n\n` +
      `> *Costs are estimated using ~0.3 tokens/char. Actual costs depend on tokenizer.*`,
  };
}

function handleResume(): CommandResult {
  const sessions = typeof window !== 'undefined'
    ? (() => {
        try {
          const raw = localStorage.getItem('claude-code-sessions');
          if (!raw) return [];
          return JSON.parse(raw) as Array<{ id: string; name: string; date: string; messages: number }>;
        } catch {
          return [];
        }
      })()
    : [];

  if (sessions.length === 0) {
    return {
      type: 'message',
      content:
        '### 📂 Previous Sessions\n\nNo previous sessions found.\n\n' +
        '> Sessions are saved automatically when you use /rename.',
    };
  }

  const list = sessions
    .slice(-10)
    .map((s, i) => `${i + 1}. **${s.name}** — ${s.date} (${s.messages} msgs)`)
    .join('\n');

  return {
    type: 'message',
    content: `### 📂 Previous Sessions\n\n${list}`,
  };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
