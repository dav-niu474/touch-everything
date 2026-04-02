# Touch Everything

> Claude Code for the Web — AI-powered coding assistant with slash commands, tool use, and intelligent code management.

Inspired by [Anthropic Claude Code](https://github.com/anthropics/claude-code), **Touch Everything** brings the full terminal experience to your browser and beyond — with plans for multi-channel access, multi-agent orchestration, and enterprise-grade features.

Built with Next.js 16, TypeScript, NVIDIA NIM (DeepSeek V3.1), and shadcn/ui.

---

## Table of Contents

- [Current Status: v0.3.0](#current-status-v030)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Available Commands](#available-commands)
- [Development Roadmap](#development-roadmap)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Current Status: v0.3.0

> **Release Date**: 2025 | **Codename**: "Foundation"

v0.3.0 establishes the core platform — a fully functional AI chat interface with streaming responses, 36 slash commands, a terminal-style command palette with fuzzy search and keyboard navigation, and 6 AI-powered tools for code execution and file management.

### Implemented Features

| Module | Feature | Status |
|--------|---------|--------|
| **Chat UI** | Dark theme + `#E8710A` accent (Claude Code inspired) | ✅ |
| **Chat UI** | Markdown/GFM rendering + syntax highlighted code blocks (18+ languages) | ✅ |
| **Chat UI** | SSE streaming output with real-time token display | ✅ |
| **Chat UI** | Tool call live display (running/completed/error) | ✅ |
| **Chat UI** | Abort generation (AbortController) | ✅ |
| **Commands** | 36 slash commands across 5 categories | ✅ |
| **Commands** | Terminal-style Command Palette with fuzzy search | ✅ |
| **Commands** | Command history navigation (↑/↓ arrows) | ✅ |
| **Commands** | Tab auto-completion for commands and arguments | ✅ |
| **Commands** | Inline hint bar showing selected command details | ✅ |
| **Commands** | Command alias system | ✅ |
| **Commands** | Command argument definitions (enum, string types) | ✅ |
| **Tools** | bash (shell execution, 30s timeout) | ✅ |
| **Tools** | file_read / file_write / file_edit | ✅ |
| **Tools** | glob_search / grep_search | ✅ |
| **Tools** | Intelligent tool loop (max 10 rounds) | ✅ |
| **Model** | 4 models selectable (ModelSelector popup) | ✅ |
| **Session** | localStorage persistence (settings) | ✅ |
| **API** | Health check endpoint (`/api/health`) | ✅ |
| **UI** | shadcn/ui complete component library (50+ components) | ✅ |
| **VCS** | Git initialized with GitHub remote | ✅ |

### Commands Pending Enhancement

These commands are registered but require backend integration from future phases:

| Command | Current State | Needed |
|---------|--------------|--------|
| `/compact` | Sends to API | Context compaction engine (Phase 3) |
| `/review` | Sends to API | Git diff integration (Phase 7) |
| `/diff` | Sends to API | Git integration (Phase 7) |
| `/memory` | Sends to API | CLAUDE.md file management (Phase 3) |
| `/init` | Sends to API | Project initialization flow |
| `/pr-comments` | Sends to API | GitHub/GitLab PR API (Phase 7) |
| `/permissions` | Client display only | Permission Engine (Phase 2) |
| `/mcp` | Client display only | MCP Client (Phase 5) |
| `/tasks` | Client display only | TodoWrite Tool (Phase 4) |
| `/cost` | Client display only | Token Tracker (Phase 3) |

---

## Features

- **🤖 AI Chat** — Natural language conversation with streaming responses
- **🔧 36 Slash Commands** — `/help`, `/clear`, `/compact`, `/model`, `/review`, `/doctor`, and more
- **⚡ Tool System** — AI can execute bash commands, read/write/edit files, search code
- **🔍 Command Palette** — Terminal-style autocomplete with fuzzy search, keyboard navigation (↑↓), Tab completion, inline hints
- **📋 Model Selector** — Switch between DeepSeek V3.1, Llama 3.1, Mistral Large 2, Nemotron 70B
- **📊 Session Stats** — Token usage, cost estimates, tool call tracking
- **🎨 Dark Theme** — Claude Code-inspired dark UI with warm orange accent

---

## Quick Start

```bash
# Install dependencies
bun install

# Setup database
bun run db:push

# Run development server
bun run dev

# Open http://localhost:3000
```

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Chat API with NVIDIA NIM + intelligent tool loop
│   │   └── health/route.ts    # Health check endpoint
│   ├── layout.tsx             # Root layout with dark theme metadata
│   ├── page.tsx               # Main chat page
│   └── globals.css            # Global styles + Claude Code color tokens
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx      # Input with command palette, history, tab completion
│   │   ├── ChatMessage.tsx    # Message with Markdown/GFM rendering
│   │   ├── CodeBlock.tsx      # Syntax highlighted code (atomOneDark, 18+ langs)
│   │   ├── CommandPalette.tsx # Fuzzy search popup with keyboard navigation
│   │   ├── ModelSelector.tsx  # Model picker popup
│   │   ├── SystemMessage.tsx  # System notification display
│   │   └── ToolCallBlock.tsx  # Collapsible tool call/result cards
│   └── ui/                    # shadcn/ui components (50+)
├── lib/
│   ├── commands.ts            # Command registry (36 commands, 5 categories)
│   ├── command-handlers.ts    # Unified command execution engine
│   ├── nvidia.ts              # NVIDIA NIM API client (OpenAI SDK)
│   └── tools.ts               # 6 tool definitions + executors
└── store/
    ├── chat-store.ts          # Chat state management (Zustand)
    └── command-store.ts       # Command settings persistence
```

### Data Flow

```
Browser (React 19 + Zustand)
  │
  ├── ChatInput ──── CommandPalette (/ commands, fuzzy search)
  │                   ModelSelector (model switching)
  │                   History (↑↓), Tab completion, Inline hints
  │
  ├── ChatMessage ── ToolCallBlock (live tool call display)
  │                   CodeBlock (syntax highlighting)
  │                   SystemMessage (system notifications)
  │
  └── POST /api/chat ──┐
                       │  SSE Streaming
                       │  Tool Loop (max 10 rounds)
                       ▼
              NVIDIA NIM API
              (DeepSeek V3.1)
                       │
              ┌────────┼────────┐
              │        │        │
           bash    file_ops  search
```

---

## Available Commands

| Category | Commands |
|----------|----------|
| 📝 General | `/help`, `/clear`, `/undo`, `/copy`, `/export`, `/search` |
| 💬 Session | `/session`, `/stats`, `/status`, `/rename`, `/resume` |
| 🤖 AI | `/model`, `/compact`, `/fast`, `/effort`, `/plan`, `/review`, `/diff`, `/bug`, `/pr-comments` |
| ⚙️ Settings | `/config`, `/theme`, `/memory`, `/permissions`, `/doctor`, `/init`, `/vim`, `/terminal-setup`, `/edit`, `/login`, `/logout` |
| 🔧 Tools | `/tasks`, `/mcp`, `/cost` |

---

## Development Roadmap

Based on deep analysis of the Claude Code source (v2.1.888, 1000+ files), we've mapped out a comprehensive 10-phase roadmap to replicate and extend Claude Code's full capabilities. See [ROADMAP.md](./ROADMAP.md) for complete technical specifications.

### Phase Overview

| Phase | Name | Priority | Status | Description |
|-------|------|----------|--------|-------------|
| **Phase 1** | Command UX Enhancement | 🔴 High | 🔵 Partial | Fuzzy search, ↑↓ history, Tab completion for args, keyboard shortcuts, preview panel |
| **Phase 2** | Permission System | 🔴 High | ⬜ Planned | 3-level behavior control (Allow/Ask/Deny), 5 permission modes, destructive command detection, audit log |
| **Phase 3** | Context Management | 🔴 High | ⬜ Planned | 3-tier compaction (MicroCompact / Session Memory / API Summary), token budget tracking, auto-compact |
| **Phase 4** | Advanced Tools | 🟠 Medium-High | ⬜ Planned | Web search, web fetch, Todo management, image upload, notebook edit, sub-agent spawn |
| **Phase 5** | MCP Integration | 🟠 Medium | ⬜ Planned | Full MCP protocol (stdio/SSE/HTTP/WebSocket), tool discovery, resource browsing, config UI |
| **Phase 6** | Multi-Agent System | 🟡 Medium | ⬜ Planned | Built-in agents (explore/plan/verify/general), custom agents (.claude/agents/), coordinator mode |
| **Phase 7** | Git & Code Intelligence | 🟡 Medium | ⬜ Planned | Git integration, AI code review (/review), PR comments, branch management, LSP integration |
| **Phase 8** | Multi-Channel Access | 🟠 Medium-High | ⬜ Planned | REST API v1, WebSocket server, PWA, WeChat/Slack/DingTalk bots, API key management |
| **Phase 9** | Enterprise Features | 🟢 Medium-Low | ⬜ Planned | Auth (NextAuth.js), multi-user, team workspaces, audit logging, analytics dashboard, data retention |
| **Phase 10** | Advanced UX | 🟢 Medium-Low | ⬜ Planned | Split-pane editor, terminal emulator, drag-and-drop files, voice input, collaborative editing |

### Phase 1 Progress (In Progress)

v0.3.0 has already shipped several Phase 1 features:

- ✅ Command history navigation (↑/↓)
- ✅ Fuzzy search in CommandPalette
- ✅ Tab completion for commands
- ✅ Inline hint bar for selected command details
- 🔲 Tab completion for enum arguments (`/effort low|medium|high`)
- 🔲 `Ctrl+K` global search, `Ctrl+/` focus input
- 🔲 Right-side command preview panel
- 🔲 Category icons in CommandPalette

### Vision: From CLI to Multi-Channel AI Platform

```
                    ┌─────────────────────────────────┐
                    │      Touch Everything v2.0       │
                    │     Multi-Channel AI Platform     │
                    ├─────────────────────────────────┤
  v0.3 (Current)    │  Browser ← Web Chat + Commands   │
  v0.5              │  + Permission + Context Mgmt      │
  v0.7              │  + Advanced Tools + MCP           │
  v1.0              │  + Multi-Agent + Git Integration  │
  v1.5              │  + REST API + WebSocket + PWA     │
  v2.0              │  + Enterprise + Bots + Desktop    │
                    └─────────────────────────────────┘
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui |
| **AI Backend** | NVIDIA NIM API (OpenAI-compatible) |
| **Default Model** | DeepSeek V3.1 (`deepseek-ai/deepseek-v3.1`) |
| **Available Models** | DeepSeek V3.1 / Llama 3.1 70B / Mistral Large 2 / Nemotron 70B |
| **State Management** | Zustand |
| **Markdown** | react-markdown + remark-gfm |
| **Syntax Highlighting** | react-syntax-highlighter (atomOneDark) |
| **Animations** | framer-motion |
| **Database** | Prisma ORM (SQLite) |
| **Runtime** | Bun |

---

## License

MIT
