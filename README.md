# Touch Everything

> Claude Code for the Web — AI-powered coding assistant with slash commands, tool use, and intelligent code management.

Built with Next.js 16, TypeScript, NVIDIA NIM (DeepSeek V3.1), and shadcn/ui.

## Features

- **🤖 AI Chat** — Natural language conversation with streaming responses
- **🔧 36 Slash Commands** — `/help`, `/clear`, `/compact`, `/model`, `/review`, `/doctor`, and more
- **⚡ Tool System** — AI can execute bash commands, read/write/edit files, search code
- **🔍 Command Palette** — VS Code-style autocomplete with keyboard navigation
- **📋 Model Selector** — Switch between DeepSeek V3.1, Llama 3.1, Mistral Large 2, Nemotron 70B
- **📊 Session Stats** — Token usage, cost estimates, tool call tracking
- **🎨 Dark Theme** — Claude Code-inspired dark UI with warm orange accent

## Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Open http://localhost:3000
```

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Chat API with NVIDIA NIM + tool loop
│   │   └── health/route.ts    # Health check endpoint
│   ├── layout.tsx             # Root layout with metadata
│   ├── page.tsx               # Main chat page
│   └── globals.css            # Global styles
├── components/
│   ├── chat/
│   │   ├── ChatInput.tsx      # Input with command palette integration
│   │   ├── ChatMessage.tsx    # Message with Markdown rendering
│   │   ├── CodeBlock.tsx      # Syntax highlighted code
│   │   ├── CommandPalette.tsx # Command autocomplete popup
│   │   ├── ModelSelector.tsx  # Model picker popup
│   │   ├── SystemMessage.tsx  # System notification display
│   │   └── ToolCallBlock.tsx  # Tool call/result card
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── commands.ts            # Command registry (36 commands)
│   ├── command-handlers.ts    # Command execution engine
│   ├── nvidia.ts              # NVIDIA NIM API client
│   └── tools.ts               # 6 tool definitions + executors
└── store/
    ├── chat-store.ts          # Chat state management (Zustand)
    └── command-store.ts       # Command settings persistence
```

## Available Commands

| Category | Commands |
|----------|----------|
| 📝 General | `/help`, `/clear`, `/undo`, `/copy`, `/export`, `/search` |
| 💬 Session | `/session`, `/stats`, `/status`, `/rename`, `/resume` |
| 🤖 AI | `/model`, `/compact`, `/fast`, `/effort`, `/plan`, `/review`, `/diff`, `/bug`, `/pr-comments` |
| ⚙️ Settings | `/config`, `/theme`, `/memory`, `/permissions`, `/doctor`, `/init`, `/vim`, `/terminal-setup`, `/edit`, `/login`, `/logout` |
| 🔧 Tools | `/tasks`, `/mcp`, `/cost` |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **AI**: NVIDIA NIM (DeepSeek V3.1)
- **State**: Zustand
- **Markdown**: react-markdown + remark-gfm
- **Syntax Highlighting**: react-syntax-highlighter
- **Animations**: framer-motion

## License

MIT
