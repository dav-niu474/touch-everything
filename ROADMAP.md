# Claude Code Web — 开发路线图

> **Claude Code Web** 是 Anthropic Claude Code CLI 的 Web 端复刻版，基于 **Next.js 16 + NVIDIA NIM API + DeepSeek V3.1** 模型构建。本项目旨在将 Claude Code 的全部终端体验迁移到浏览器，并扩展为多渠道、多 Agent、企业级的智能编码平台。

---

## 目录

- [项目概览](#项目概览)
- [系统架构](#系统架构)
- [当前状态 v0.2](#当前状态-v02)
- [Phase 1: Command UX 增强](#phase-1-command-ux-增强)
- [Phase 2: Permission 权限系统](#phase-2-permission-权限系统)
- [Phase 3: Context 上下文管理](#phase-3-context-上下文管理)
- [Phase 4: Advanced Tools 高级工具](#phase-4-advanced-tools-高级工具)
- [Phase 5: MCP 集成](#phase-5-mcp-集成)
- [Phase 6: Multi-Agent 多智能体系统](#phase-6-multi-agent-多智能体系统)
- [Phase 7: Git & Code Intelligence](#phase-7-git--code-intelligence)
- [Phase 8: Multi-Channel 多渠道接入](#phase-8-multi-channel-多渠道接入)
- [Phase 9: Enterprise 企业级特性](#phase-9-enterprise-企业级特性)
- [Phase 10: Advanced UX 高级体验](#phase-10-advanced-ux-高级体验)
- [技术决策](#技术决策)
- [多渠道架构设计](#多渠道架构设计)
- [里程碑时间线](#里程碑时间线)

---

## 项目概览

| 维度 | 说明 |
|------|------|
| **项目名称** | Claude Code Web |
| **当前版本** | v0.2.0 |
| **核心定位** | Web 端 AI 编码助手，对标 Anthropic Claude Code CLI |
| **技术栈** | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · Prisma · Bun |
| **AI 后端** | NVIDIA NIM API（OpenAI 兼容协议） |
| **默认模型** | DeepSeek V3.1 (`deepseek-ai/deepseek-v3.1`) |
| **可用模型** | DeepSeek V3.1 / Llama 3.1 70B / Mistral Large 2 / Nemotron 70B |

### 设计理念

1. **浏览器即终端** — 将 Claude Code 的完整 CLI 体验迁移到 Web 端
2. **多渠道统一** — REST API / WebSocket / PWA / Bot 接入统一架构
3. **Agent First** — 原生支持 Multi-Agent 协作和 MCP 协议扩展
4. **渐进增强** — 从基础聊天到企业级平台逐步演进

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          接入层 (Access Layer)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐   │
│  │  Browser │ │ REST API │ │WebSocket │ │   PWA    │ │WeChat/Slack│  │
│  │  (Next.js│ │  /v1/    │ │  /ws/    │ │ Service  │ │ DingTalk  │   │
│  │   SSR)   │ │          │ │          │ │  Worker  │ │   Bots    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘   │
│       └────────────┴────────────┴────────────┴─────────────┘          │
├─────────────────────────────────────────────────────────────────────────┤
│                        应用层 (Application Layer)                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Session Manager (会话管理)                    │  │
│  │  ┌─────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────────┐  │  │
│  │  │ Message │ │ Context      │ │Permission│ │  Token Budget  │  │  │
│  │  │ History │ │ Compaction   │ │  Engine  │ │  Tracker       │  │  │
│  │  └─────────┘ └──────────────┘ └──────────┘ └────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Tool Execution Engine (工具引擎)               │  │
│  │  ┌──────┐ ┌─────────┐ ┌─────────┐ ┌──────┐ ┌───────────────┐   │  │
│  │  │ bash │ │file_ops │ │ search  │ │ web  │ │  MCP Client   │   │  │
│  │  └──────┘ └─────────┘ └─────────┘ └──────┘ └───────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Agent Orchestrator (Agent 编排器)              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │  │
│  │  │ explore  │ │   plan   │ │  verify  │ │ custom agents    │   │  │
│  │  │  agent   │ │  agent   │ │  agent   │ │ (.claude/agents/)│   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                        数据层 (Data Layer)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐ │
│  │ SQLite / │ │localStorage│ │  Redis   │ │   NVIDIA NIM API        │ │
│  │PostgreSQL│ │ (Client)  │ │ (Cache)  │ │ (OpenAI-compatible)     │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 当前架构 (v0.2)

```
Browser (React 19 + Zustand)
  │
  ├── ChatInput ──── CommandPalette (/命令自动补全)
  │                   ModelSelector (模型切换)
  │
  ├── ChatMessage ── ToolCallBlock (工具调用展示)
  │                   CodeBlock (代码高亮)
  │                   SystemMessage (系统消息)
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

## 当前状态 v0.2

### 已实现功能清单

| 模块 | 功能 | 状态 |
|------|------|------|
| **Chat UI** | 深色主题 + `#E8710A` 强调色 | ✅ |
| **Chat UI** | Markdown 渲染 + 代码高亮 (react-syntax-highlighter) | ✅ |
| **Chat UI** | SSE 流式输出 | ✅ |
| **Chat UI** | Tool Call 实时展示 (running/completed/error) | ✅ |
| **Chat UI** | 中止生成 (AbortController) | ✅ |
| **Commands** | 36 条斜杠命令，5 个分类 | ✅ |
| **Commands** | Command Palette (cmdk 驱动，分类显示) | ✅ |
| **Commands** | 命令别名系统 (aliases) | ✅ |
| **Commands** | 命令参数定义 (CommandArg type) | ✅ |
| **Tools** | bash (shell 执行，30s 超时) | ✅ |
| **Tools** | file_read / file_write / file_edit | ✅ |
| **Tools** | glob_search / grep_search | ✅ |
| **Tools** | Tool Loop (最多 10 轮) | ✅ |
| **Model** | 4 个模型可选 (ModelSelector) | ✅ |
| **Session** | localStorage 持久化 (设置项) | ✅ |
| **API** | Health Check (`/api/health`) | ✅ |
| **UI Library** | shadcn/ui 完整组件库 (50+ 组件) | ✅ |

### 已定义但未实现的 Slash Commands

以下命令已在 `commands.ts` 中注册，但 handler 逻辑需要完善或增强：

| 命令 | 当前状态 | 需要的工作 |
|------|---------|-----------|
| `/compact` | 发送到 API | 需要 context compaction 策略 |
| `/review` | 发送到 API | 需要 Git diff 集成 |
| `/diff` | 发送到 API | 需要 Git 集成 |
| `/memory` | 发送到 API | 需要 CLAUDE.md 文件管理 |
| `/init` | 发送到 API | 需要项目初始化流程 |
| `/pr-comments` | 发送到 API | 需要 GitHub/GitLab PR API |
| `/permissions` | 仅客户端展示 | 需要 Permission Engine (Phase 2) |
| `/mcp` | 仅客户端展示 | 需要 MCP Client (Phase 5) |
| `/tasks` | 仅客户端展示 | 需要 TodoWrite Tool (Phase 4) |
| `/cost` | 仅客户端展示 | 需要 Token Tracker (Phase 3) |

---

## Phase 1: Command UX 增强

> **目标**：提升命令输入体验，达到 Claude Code CLI 级别的交互效率
> **优先级**：🔴 高 | **预估工期**：1-2 周

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 1.1 | Command Input Inline Hint | P0 | 1d | 输入命令时在输入框下方实时显示选中命令的 description、usage、args 说明 |
| 1.2 | Command History (↑/↓) | P0 | 1d | 按 ↑↓ 箭头键在历史输入中导航，支持搜索历史 |
| 1.3 | Fuzzy Search Scoring | P1 | 1d | 为 `searchCommands()` 添加 fuzzy match 算法（考虑 `fuse.js` 或自实现） |
| 1.4 | Command Grouping Icons | P1 | 0.5d | CommandPalette 中每个 category 前显示对应 icon（已有 `CATEGORY_ICONS`，需接入） |
| 1.5 | Tab Completion for Args | P1 | 1.5d | 输入 `/effort ` 后按 Tab 自动补全 enum values (`low|medium|high`) |
| 1.6 | Keyboard Shortcuts | P2 | 1d | `Ctrl+K` 打开全局搜索、`Ctrl+/` 聚焦输入、`Esc` 关闭面板 |
| 1.7 | Command Preview Panel | P2 | 1d | 右侧滑出面板展示完整命令帮助文档 |

### 技术方案

```typescript
// 1.1 Inline Hint — 在 ChatInput 组件中添加
const selectedCommand = isCommandMode ? getCommandByName(input.slice(1).split(' ')[0]) : null;

// 1.2 Command History — 使用 Zustand 或独立 hook
const [historyIndex, setHistoryIndex] = useState(-1);
const commandHistory = useRef<string[]>([]);

// 1.3 Fuzzy Search — 使用 fuse.js
import Fuse from 'fuse.js';
const fuse = new Fuse(commands, { keys: ['name', 'aliases', 'description'], threshold: 0.3 });

// 1.5 Tab Completion — 修改 handleKeyDown
if (e.key === 'Tab' && selectedCommand?.args?.[0]?.type === 'enum') {
  e.preventDefault();
  // Auto-complete enum value
}
```

### 验收标准

- [ ] 输入 `/effort` 时，输入框下方显示 `"Set the AI reasoning effort level"` 和参数提示
- [ ] 按 ↑ 键可回溯上一条输入，↓ 键前进
- [ ] 输入 `/ef` 能 fuzzy match 到 `/effort`
- [ ] `/effort ` + Tab 循环补全 `low → medium → high`

---

## Phase 2: Permission 权限系统

> **目标**：实现 Claude Code 的三级行为控制（Allow/Ask/Deny），保护用户系统安全
> **优先级**：🔴 高 | **预估工期**：2-3 周

### 架构设计

```
User Input → Tool Call Request
                    │
                    ▼
            ┌───────────────┐
            │ Permission    │
            │ Engine        │
            │               │
            │  1. 检查 Mode │
            │  2. 匹配 Rule │
            │  3. 检测危险  │
            │  4. 返回决策  │
            └───────┬───────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     ALLOW        ASK        DENY
        │           │           │
   直接执行    弹出确认框    拒绝并提示
```

### 三种 Permission 行为

| 行为 | 说明 | 触发场景 |
|------|------|---------|
| **Allow** | 自动批准执行 | 安全的读操作（file_read, glob_search, grep_search） |
| **Ask** | 弹出确认对话框，等待用户批准 | 写操作（file_write, file_edit）、bash 命令 |
| **Deny** | 直接拒绝执行 | 高危操作（rm -rf, force push）、被明确禁止的命令 |

### 五种 Permission Mode

| Mode | 说明 | 适用场景 |
|------|------|---------|
| `default` | 读操作 Allow，写操作 Ask | 普通使用（推荐默认） |
| `acceptEdits` | 文件编辑自动 Allow，bash 仍 Ask | 信任项目修改 |
| `bypassPermissions` | 全部 Allow（仅显示警告） | 快速原型开发 |
| `plan` | 全部 Ask（仅查看不执行） | 审查模式 |
| `auto` | 基于规则自动决策 | 熟练用户自定义 |

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 2.1 | Permission Engine Core | P0 | 3d | 实现规则匹配引擎，支持 tool name、command pattern、path pattern 匹配 |
| 2.2 | Permission Rule Schema | P0 | 1d | 定义规则数据结构，支持通配符和正则 |
| 2.3 | Permission Dialog UI | P0 | 2d | 实现确认对话框（Allow Once / Always Allow / Deny） |
| 2.4 | Destructive Command Detection | P0 | 1d | 检测 `rm -rf`、`git push --force`、`DROP TABLE` 等高危命令 |
| 2.5 | Permission Persistence | P1 | 1d | 权限规则和决策历史持久化到 localStorage / DB |
| 2.6 | Permission Mode Switch | P1 | 0.5d | UI 切换 5 种 Permission Mode |
| 2.7 | Permission Audit Log | P2 | 1d | 记录所有权限决策（时间、工具、参数、决策结果） |

### 技术方案

```typescript
// 2.1 Permission Engine
interface PermissionRule {
  id: string;
  tool: string;           // 'bash' | 'file_write' | '*'
  pattern?: string;       // 'rm *' | '*.config.*'
  pathPattern?: string;   // '/etc/*' | 'node_modules/*'
  behavior: 'allow' | 'ask' | 'deny';
}

// 2.2 Rule Matching
function evaluatePermission(
  toolName: string,
  args: Record<string, unknown>,
  rules: PermissionRule[],
  mode: PermissionMode
): 'allow' | 'ask' | 'deny' {
  // 1. Check destructive commands first → DENY
  // 2. Match against user-defined rules
  // 3. Fall back to mode defaults
}

// 2.3 Permission Dialog — SSE 中断恢复
// Server 发送 permission_request 事件，暂停 tool 执行
// Client 弹出对话框，用户选择后发送 permission_response
// Server 根据响应继续或跳过 tool execution
```

### 验收标准

- [ ] 执行 `file_write` 时弹出确认对话框
- [ ] 执行 `rm -rf` 被直接拦截，显示危险警告
- [ ] 选择 "Always Allow" 后同类操作不再询问
- [ ] 切换到 `bypassPermissions` 模式后所有操作自动通过
- [ ] 权限设置在页面刷新后保留

---

## Phase 3: Context 上下文管理

> **目标**：实现 Claude Code 的三层 Compaction 策略，支持长对话不丢失关键信息
> **优先级**：🔴 高 | **预估工期**：2-3 周

### 三层 Compaction 策略

```
Context Usage 监控
        │
        ├── < 60% → 正常对话
        │
        ├── 60-80% → MicroCompact
        │   └── 清除旧的 tool output，保留最近 N 轮完整消息
        │       无需 API 调用，O(1) 即时完成
        │
        ├── 80-95% → Session Memory Compaction
        │   └── 使用 Claude Code 提取的 memory（CLAUDE.md 内容）
        │       作为对话摘要注入 system message
        │       无额外 API 成本
        │
        └── > 95% → API Summary Compaction
            └── 调用 AI 生成对话摘要
                替换早期消息
                保留 CompactBoundary 标记
```

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 3.1 | Token Counter | P0 | 1d | 精确计算每条消息的 token 数（基于 tokenizer 或估算） |
| 3.2 | Token Budget Manager | P0 | 2d | 跟踪总 token 使用量，设置阈值触发 compaction |
| 3.3 | MicroCompact Engine | P0 | 1.5d | 清除旧 tool outputs，保留消息结构 |
| 3.4 | Session Memory Integration | P0 | 2d | 读取 CLAUDE.md / session memory 作为 compact 依据 |
| 3.5 | API Summary Compaction | P0 | 2d | 调用 AI 生成摘要，替换旧消息 |
| 3.6 | CompactBoundary Markers | P1 | 0.5d | 在 compact 位置插入不可见标记 |
| 3.7 | `/context` Command | P1 | 1d | 显示当前 context 使用情况（可视化仪表盘） |
| 3.8 | Auto-Compact Trigger | P1 | 1d | context 接近限制时自动触发 compaction |
| 3.9 | `/compact` Manual Trigger | P1 | 0.5d | 用户手动触发 compaction |
| 3.10 | Context Usage Display | P2 | 1d | 持续显示 context 使用百分比（顶部进度条） |

### 技术方案

```typescript
// 3.1 Token Estimation (Tiktoken 或 简单估算)
function estimateTokens(text: string): number {
  // Rough estimation: ~4 chars per token for English, ~2 for CJK
  return Math.ceil(text.length / 3.5);
}

// 3.2 Token Budget Manager
interface TokenBudget {
  total: number;          // Model context window (e.g., 128K)
  systemPrompt: number;
  messages: number;
  toolDefinitions: number;
  reserved: number;       // Reserve for response
  usagePercent: number;   // (total - available) / total
}

// 3.3 MicroCompact — 无 API 调用
function microCompact(messages: Message[]): Message[] {
  return messages.map((msg, i) => {
    // Keep last 5 tool results intact
    // Clear tool outputs in older messages
    if (msg.toolCalls && i < messages.length - 10) {
      return { ...msg, toolCalls: msg.toolCalls.map(tc => ({
        ...tc, result: '[output compacted]'
      }))};
    }
    return msg;
  });
}

// 3.5 API Summary
async function apiCompact(messages: Message[], model: string): Promise<Message[]> {
  const summaryPrompt = `Summarize the following conversation, preserving:\n- Key decisions\n- File changes made\n- Current task state\n- Important context`;
  const summary = await chatCompletion([
    { role: 'system', content: summaryPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ], [], model);
  return [{
    id: 'compact-boundary',
    role: 'system',
    content: `[Conversation Summary]\n${summary.content}\n[End Summary]`,
    timestamp: Date.now()
  }];
}
```

### 验收标准

- [ ] 顶部显示 context 使用百分比进度条
- [ ] `/context` 命令输出详细的 token 分布信息
- [ ] context 使用超过 60% 时自动执行 MicroCompact
- [ ] context 使用超过 80% 时使用 Session Memory compaction
- [ ] `/compact` 手动触发完整 compaction
- [ ] Compact 后对话可继续正常进行

---

## Phase 4: Advanced Tools 高级工具

> **目标**：扩展 Claude Code 工具集，增加 Web 访问、Todo 管理、图片处理、子 Agent 能力
> **优先级**：🟠 中高 | **预估工期**：3-4 周

### 新增工具一览

| 工具名 | 类型 | 说明 | 来源 |
|--------|------|------|------|
| `web_search` | Web | 搜索互联网获取最新信息 | Claude Code |
| `web_fetch` | Web | 抓取并解析网页内容 | Claude Code |
| `todo_write` | Productivity | 任务/Todo 列表管理，支持进度追踪 | Claude Code |
| `notebook_edit` | Dev | Jupyter Notebook (.ipynb) 单元格编辑 | Claude Code |
| `image_upload` | Media | 图片上传和 Base64 编码处理 | Web 增强 |
| `agent_spawn` | Agent | 派生子 Agent 执行独立任务 | Claude Code (AgentTool) |
| `background_task` | System | 后台任务管理和状态查询 | Claude Code |

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 4.1 | WebSearch Tool | P0 | 2d | 接入 `z-ai-web-dev-sdk` 的 web-search skill，搜索返回结构化结果 |
| 4.2 | WebFetch Tool | P0 | 2d | 获取网页内容，提取正文、metadata（title, publish time） |
| 4.3 | TodoWrite Tool | P0 | 2d | 实现完整的 Todo CRUD，支持 pending/in_progress/completed 状态 |
| 4.4 | Image Upload & Processing | P1 | 2d | 支持拖拽上传图片、粘贴图片、Base64 编码 |
| 4.5 | NotebookEdit Tool | P1 | 3d | 解析 .ipynb JSON 结构，支持单元格的编辑、添加、删除 |
| 4.6 | Agent Spawn (Sub-agent) | P1 | 3d | 派生独立 Agent 执行子任务，结果汇总回主对话 |
| 4.7 | Background Task Manager | P2 | 2d | 长时间运行的 tool 放到后台，支持查询状态和取消 |
| 4.8 | Tool Result Caching | P2 | 1d | 相同参数的 tool 结果缓存，减少重复调用 |

### 技术方案

```typescript
// 4.1 WebSearch — 使用 z-ai-web-dev-sdk
async function executeWebSearch(args: { query: string }): Promise<ToolResult> {
  const { webSearch } = await import('z-ai-web-dev-sdk');
  const results = await webSearch({ query: args.query });
  return { success: true, output: JSON.stringify(results, null, 2) };
}

// 4.3 TodoWrite — 内嵌到 tool system
interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

// 4.6 Agent Spawn — 子 Agent 框架
async function executeAgentSpawn(args: {
  task: string;
  agentType: 'explore' | 'plan' | 'verify' | 'general';
  tools?: string[];  // 限制可用工具
}): Promise<ToolResult> {
  // 1. 创建独立 context
  // 2. 派生 API 调用
  // 3. 执行 tool loop
  // 4. 返回最终结果给主对话
}
```

### 验收标准

- [ ] AI 可使用 `web_search` 搜索实时信息
- [ ] AI 可使用 `web_fetch` 读取网页正文
- [ ] `/tasks` 命令显示当前 Todo 列表和状态
- [ ] 可拖拽/粘贴图片到输入框
- [ ] 子 Agent 可独立执行探索任务并返回结果

---

## Phase 5: MCP (Model Context Protocol) 集成

> **目标**：实现完整的 MCP 协议支持，让 AI 可接入外部工具和数据源
> **优先级**：🟠 中 | **预估工期**：3-4 周

### MCP 架构

```
┌────────────────────────────────────────────┐
│              Claude Code Web               │
│  ┌──────────────────────────────────────┐  │
│  │         MCP Client Manager           │  │
│  │                                      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌────────┐ │  │
│  │  │ stdio   │ │  SSE    │ │ HTTP   │ │  │
│  │  │Transport│ │Transport│ │Transp. │ │  │
│  │  └────┬────┘ └────┬────┘ └───┬────┘ │  │
│  └───────┼───────────┼──────────┼───────┘  │
│          │           │          │          │
│  ┌───────┴───┐ ┌────┴────┐ ┌──┴───────┐  │
│  │  MCP      │ │  MCP    │ │  MCP     │  │
│  │  Server A │ │ Server B│ │  Server C│  │
│  │ (local)   │ │ (remote)│ │ (plugin) │  │
│  └───────────┘ └─────────┘ └──────────┘  │
└────────────────────────────────────────────┘
```

### 支持的 Transport 类型

| Transport | 协议 | 适用场景 |
|-----------|------|---------|
| **stdio** | stdin/stdout JSON-RPC | 本地 MCP Server（进程间通信） |
| **SSE** | Server-Sent Events + HTTP POST | 远程 MCP Server（单向推送） |
| **HTTP** | HTTP POST JSON-RPC | 远程 MCP Server（请求-响应） |
| **WebSocket** | ws:// JSON-RPC | 远程 MCP Server（双向实时） |

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 5.1 | MCP Client Core | P0 | 3d | JSON-RPC 2.0 客户端，支持 initialize/tools/call 等基础协议 |
| 5.2 | Stdio Transport | P0 | 2d | 通过子进程与本地 MCP Server 通信 |
| 5.3 | SSE Transport | P0 | 2d | Server-Sent Events + HTTP POST 双通道 |
| 5.4 | HTTP Transport | P0 | 1d | 标准 HTTP POST JSON-RPC |
| 5.5 | WebSocket Transport | P1 | 2d | WebSocket 持久连接 + JSON-RPC |
| 5.6 | Tool Discovery | P0 | 1d | 自动发现 MCP Server 提供的 tools，注册到工具引擎 |
| 5.7 | Resource Browsing | P1 | 2d | 实现 `ListMcpResources` + `ReadMcpResource` |
| 5.8 | MCP Config UI | P1 | 2d | 可视化配置 MCP Servers（增删改查、启用/禁用） |
| 5.9 | OAuth Support | P2 | 3d | 支持 OAuth 2.0 认证的 MCP Server |
| 5.10 | Connection Management | P1 | 2d | 自动重连、健康检查、连接状态监控 |
| 5.11 | `/mcp` Command Enhancement | P1 | 1d | 显示所有已连接的 MCP Server 及其 tools |
| 5.12 | Plugin MCP Servers | P2 | 2d | 支持 npm 包形式的 MCP Server 插件 |

### 技术方案

```typescript
// 5.1 MCP Client Core
interface McpClient {
  connect(serverConfig: McpServerConfig): Promise<void>;
  disconnect(serverId: string): Promise<void>;
  listTools(serverId: string): Promise<ToolDefinition[]>;
  callTool(serverId: string, toolName: string, args: unknown): Promise<ToolResult>;
  listResources(serverId: string): Promise<McpResource[]>;
  readResource(serverId: string, uri: string): Promise<string>;
}

// 5.2 Stdio Transport
class StdioTransport implements McpTransport {
  private process: ChildProcess;
  async send(message: JsonRpcMessage): Promise<void> {
    this.process.stdin.write(JSON.stringify(message) + '\n');
  }
  onMessage(handler: (msg: JsonRpcMessage) => void): void {
    this.process.stdout.on('data', (data) => {
      handler(JSON.parse(data.toString()));
    });
  }
}

// 5.6 Tool Discovery — 动态注册
async function discoverMcpTools(client: McpClient, serverId: string) {
  const tools = await client.listTools(serverId);
  for (const tool of tools) {
    toolRegistry.register({
      ...tool,
      executor: (args) => client.callTool(serverId, tool.name, args),
      source: `mcp:${serverId}`
    });
  }
}
```

### 验收标准

- [ ] 可配置并连接本地 MCP Server (stdio)
- [ ] 可连接远程 MCP Server (SSE/HTTP)
- [ ] MCP Server 提供的 tools 出现在 `/mcp` 列表中
- [ ] AI 可自动调用 MCP tools
- [ ] MCP Server 断线后自动重连
- [ ] 配置页面可管理多个 MCP Server

---

## Phase 6: Multi-Agent 多智能体系统

> **目标**：实现 Claude Code 的内置 Agent 系统和自定义 Agent 支持
> **优先级**：🟡 中 | **预估工期**：3-4 周

### Agent 类型

| Agent | 角色 | 行为特征 |
|-------|------|---------|
| **explore** 🔍 | 代码探索 | 只读操作，使用 file_read/glob_search/grep_search |
| **plan** 📋 | 任务规划 | 分析任务，生成执行计划，不执行修改 |
| **verify** ✅ | 验证测试 | 运行测试、检查类型、验证代码正确性 |
| **general-purpose** 🛠️ | 通用 Agent | 可使用所有工具，执行任意任务 |
| **Custom** ⚙️ | 用户自定义 | 从 `.claude/agents/` 加载配置 |

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 6.1 | Agent Framework Core | P0 | 3d | Agent 抽象层（interface、lifecycle、context 隔离） |
| 6.2 | Built-in Agents | P0 | 2d | 实现 explore / plan / verify / general-purpose 四种内置 Agent |
| 6.3 | Agent Color Management | P1 | 0.5d | 每个 Agent 分配唯一颜色，UI 中视觉区分 |
| 6.4 | Custom Agent Config | P1 | 2d | 支持 `.claude/agents/*.md` 格式定义自定义 Agent |
| 6.5 | Fork Subagent | P1 | 2d | 派生子 Agent，共享父 context 但独立执行 |
| 6.6 | Coordinator Mode | P2 | 3d | 编排多个 Worker Agent 并行执行任务 |
| 6.7 | Inter-Agent Communication | P2 | 2d | Agent 之间传递消息和共享状态 |
| 6.8 | Agent Task Queue | P2 | 1.5d | 任务队列管理，支持优先级和依赖关系 |

### 自定义 Agent 配置格式

```markdown
<!-- .claude/agents/security-reviewer.md -->
# Security Reviewer Agent

## 角色
你是一个安全审计专家，专注于代码安全审查。

## 允许使用的工具
- file_read
- grep_search
- glob_search

## 行为约束
- 不要修改任何文件
- 只读取和分析代码
- 输出安全漏洞报告

## 输出格式
### 发现的安全问题
1. [严重程度] 文件路径:行号 - 问题描述
   - 建议修复方案
```

### 技术方案

```typescript
// 6.1 Agent Framework
interface Agent {
  id: string;
  name: string;
  type: 'explore' | 'plan' | 'verify' | 'general' | 'custom';
  color: string;           // Tailwind color class
  allowedTools: string[];  // Tool whitelist
  systemPrompt: string;    // Agent-specific system prompt
  context: Message[];      // Isolated context
}

// 6.6 Coordinator Mode
class AgentCoordinator {
  async orchestrate(task: string): Promise<void> {
    // 1. Plan Agent 分析任务
    const plan = await this.spawn('plan', `Analyze: ${task}`);
    // 2. 分解为子任务
    const subtasks = this.parseSubtasks(plan);
    // 3. 并行派生 Worker Agents
    const results = await Promise.allSettled(
      subtasks.map(t => this.spawn('general', t))
    );
    // 4. Verify Agent 验证结果
    await this.spawn('verify', JSON.stringify(results));
  }
}
```

### 验收标准

- [ ] 可通过命令派生 explore/plan/verify Agent
- [ ] 各 Agent 在 UI 中用不同颜色区分
- [ ] 可创建 `.claude/agents/` 自定义 Agent
- [ ] 子 Agent 只能使用被允许的工具
- [ ] Coordinator 模式可并行调度多个 Agent

---

## Phase 7: Git & Code Intelligence

> **目标**：深度集成 Git 和代码智能，提供完整的代码审查工作流
> **优先级**：🟡 中 | **预估工期**：2-3 周

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 7.1 | Git Integration Core | P0 | 2d | `git diff`、`git status`、`git log`、`git commit` |
| 7.2 | `/review` Command | P0 | 2d | AI 审查当前 diff / 未提交的更改 |
| 7.3 | `/pr-comments` Command | P0 | 2d | 获取并展示 GitHub/GitLab PR 评论 |
| 7.4 | Branch Management | P1 | 1.5d | 创建/切换/合并分支 |
| 7.5 | Git Worktree Isolation | P1 | 2d | 为不同 Agent/任务使用独立 worktree |
| 7.6 | LSP Integration | P2 | 4d | Language Server Protocol 客户端，获取诊断信息 |
| 7.7 | Code Diagnostics Display | P2 | 2d | 在 UI 中展示 LSP 诊断（错误、警告、提示） |

### 技术方案

```typescript
// 7.1 Git Tool
async function executeGit(args: {
  command: string;
}): Promise<ToolResult> {
  const allowedCommands = ['diff', 'status', 'log', 'commit', 'branch', 'checkout', 'add'];
  const [subcmd] = args.command.split(' ');
  if (!allowedCommands.includes(subcmd)) {
    return { success: false, output: '', error: `Git command not allowed: ${subcmd}` };
  }
  return executeBash({ command: `git ${args.command}` });
}

// 7.2 /review Command Handler
async function handleReview(): Promise<string> {
  const diff = await executeBash({ command: 'git diff HEAD' });
  const staged = await executeBash({ command: 'git diff --staged' });
  const response = await chatCompletion([
    { role: 'system', content: 'Review the following code changes. Point out bugs, style issues, and suggest improvements.' },
    { role: 'user', content: `Unstaged:\n${diff.output}\n\nStaged:\n${staged.output}` }
  ]);
  return response.content || 'No review available';
}
```

### 验收标准

- [ ] `/review` 自动审查未提交的代码更改
- [ ] `/diff` 展示格式化的 Git diff
- [ ] AI 可创建 Git commit（需 permission 确认）
- [ ] `/pr-comments` 获取并展示 PR 评审意见

---

## Phase 8: Multi-Channel 多渠道接入

> **目标**：将 Claude Code Web 扩展为多渠道 AI 平台（类 OpenClaw 架构）
> **优先级**：🟠 中高 | **预估工期**：4-6 周

### 多渠道架构

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Gateway Layer (网关层)                        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  REST API    │  │  WebSocket   │  │   PWA /      │              │
│  │  /v1/chat    │  │  /ws/chat    │  │  Service     │              │
│  │  /v1/sessions│  │  /ws/stream  │  │  Worker      │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────┴─────────────────┴──────────────────┴───────┐              │
│  │              Channel Adapter Layer                  │              │
│  │  ┌──────────────────────────────────────────────┐  │              │
│  │  │         Unified Session Manager              │  │              │
│  │  │  (同一 session 可跨渠道访问)                    │  │              │
│  │  └──────────────────────────────────────────────┘  │              │
│  └──────────────────────┬────────────────────────────┘              │
│                         │                                             │
│  ┌──────────────────────┴────────────────────────────┐              │
│  │              Bot Integration Layer                 │              │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │              │
│  │  │  WeChat  │ │  Slack   │ │    DingTalk       │ │              │
│  │  │   Bot    │ │   Bot    │ │      Bot          │ │              │
│  │  └──────────┘ └──────────┘ └───────────────────┘ │              │
│  └──────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
```

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 8.1 | REST API v1 | P0 | 3d | `/v1/chat/completions`、`/v1/sessions`、`/v1/tools` |
| 8.2 | WebSocket Server | P0 | 3d | 双向实时通信，支持 streaming、tool call 交互 |
| 8.3 | API Key Management | P0 | 2d | API Key 生成、鉴权、限流 |
| 8.4 | Rate Limiting | P0 | 2d | 基于用户/API Key 的请求频率限制 |
| 8.5 | Session Sharing | P1 | 2d | 通过 URL + QR Code 分享会话 |
| 8.6 | Mobile-Responsive PWA | P1 | 3d | 移动端适配、Service Worker、离线缓存 |
| 8.7 | WeChat Bot Integration | P2 | 3d | 微信公众号/企业微信 Bot 接入 |
| 8.8 | Slack Bot Integration | P2 | 2d | Slack App / Slash Command 集成 |
| 8.9 | DingTalk Bot Integration | P2 | 2d | 钉钉自定义机器人接入 |
| 8.10 | Desktop App Handoff | P2 | 3d | Tauri/Electron 桌面端支持 |

### REST API v1 设计

```
POST   /v1/chat/completions     # 发送消息（兼容 OpenAI 格式）
GET    /v1/sessions              # 列出所有 session
POST   /v1/sessions              # 创建新 session
GET    /v1/sessions/:id          # 获取 session 详情
DELETE /v1/sessions/:id          # 删除 session
GET    /v1/sessions/:id/messages # 获取消息历史
POST   /v1/sessions/:id/messages # 发送消息到指定 session
GET    /v1/tools                 # 列出可用工具
POST   /v1/tools/:name/execute   # 手动执行工具
GET    /v1/models                # 列出可用模型
```

### WebSocket 协议

```typescript
// Client → Server
{ type: 'message', sessionId: string, content: string }
{ type: 'command', sessionId: string, command: string, args: string }
{ type: 'permission_response', requestId: string, decision: 'allow' | 'deny' }
{ type: 'cancel', sessionId: string }

// Server → Client
{ type: 'content_delta', sessionId: string, delta: string }
{ type: 'tool_call_start', sessionId: string, toolCallId: string, name: string, args: object }
{ type: 'tool_call_result', sessionId: string, toolCallId: string, result: string }
{ type: 'permission_request', sessionId: string, requestId: string, toolName: string, args: object }
{ type: 'error', sessionId: string, message: string }
{ type: 'done', sessionId: string }
```

### 验收标准

- [ ] 可通过 REST API 创建 session 和发送消息
- [ ] WebSocket 支持双向实时通信和 streaming
- [ ] API Key 鉴权正常工作
- [ ] 超过限流阈值返回 429 状态码
- [ ] 移动端 PWA 可正常安装和使用
- [ ] 可通过 QR Code 分享会话

---

## Phase 9: Enterprise 企业级特性

> **目标**：提供企业级功能支持，适合团队协作和生产环境部署
> **优先级**：🟢 中低 | **预估工期**：4-6 周

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 9.1 | Database Session Storage | P0 | 2d | Session/Message 持久化到 PostgreSQL（替换 localStorage） |
| 9.2 | Prisma Schema Redesign | P0 | 1d | 重新设计 Prisma schema（User, Session, Message, ToolCall, etc.） |
| 9.3 | Authentication System | P0 | 3d | NextAuth.js 集成（GitHub/Google/OAuth + Email） |
| 9.4 | Multi-User Support | P0 | 2d | 用户隔离、session 隔离 |
| 9.5 | Team Workspaces | P1 | 3d | 团队共享 session、共享配置、角色权限 |
| 9.6 | Audit Logging | P1 | 2d | 记录所有操作日志（审计追踪） |
| 9.7 | Analytics Dashboard | P1 | 3d | 使用量统计、token 消耗、活跃用户图表 |
| 9.8 | Export/Import Conversations | P1 | 1.5d | 导出为 Markdown/JSON/HTML，支持导入恢复 |
| 9.9 | Managed Settings | P2 | 2d | 企业管理员可设置全局策略（限制模型、工具等） |
| 9.10 | Rate Limiting per User | P1 | 1d | 按用户的精细限流策略 |
| 9.11 | Data Retention Policy | P2 | 1.5d | 自动清理过期 session 和消息 |

### Prisma Schema (Redesigned)

```prisma
model User {
  id          String    @id @default(cuid())
  email       String    @unique
  name        String?
  role        Role      @default(USER)
  apiKeys     ApiKey[]
  sessions    Session[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ApiKey {
  id        String   @id @default(cuid())
  key       String   @unique
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  rateLimit Int      @default(100)
  expiresAt DateTime?
  createdAt DateTime @default(now())
}

model Session {
  id        String     @id @default(cuid())
  title     String?
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  model     String     @default("deepseek-ai/deepseek-v3.1")
  messages  Message[]
  settings  Json?
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Message {
  id        String     @id @default(cuid())
  sessionId String
  session   Session    @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String     // 'user' | 'assistant' | 'system'
  content   String
  toolCalls ToolCall[]
  tokens    Int?
  createdAt DateTime   @default(now())
}

model ToolCall {
  id        String  @id @default(cuid())
  messageId String
  message   Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  name      String
  arguments Json
  result    String?
  status    String  @default("pending")
  duration  Int?    // ms
}
```

### 验收标准

- [ ] Session 数据持久化到数据库，刷新页面不丢失
- [ ] 支持 GitHub/Google OAuth 登录
- [ ] 不同用户的 session 完全隔离
- [ ] Analytics Dashboard 展示使用统计
- [ ] 可导出完整对话为 Markdown/JSON

---

## Phase 10: Advanced UX 高级体验

> **目标**：打造极致的用户体验，差异化竞争
> **优先级**：🟢 低 | **预估工期**：3-5 周

### 任务清单

| # | 任务 | 优先级 | 工时 | 详细说明 |
|---|------|--------|------|---------|
| 10.1 | Voice Mode (STT Input) | P1 | 2d | 语音输入（Speech-to-Text），使用 `z-ai-web-dev-sdk` ASR |
| 10.2 | TTS Output | P2 | 1d | AI 回复朗读（Text-to-Speech） |
| 10.3 | Keyboard Customization | P2 | 2d | 自定义快捷键映射，Vim 模式增强 |
| 10.4 | Theme System | P1 | 2d | 多主题系统（已支持 3 个主题，扩展为用户可定义） |
| 10.5 | Brief Mode | P2 | 1d | 精简模式，隐藏 tool call 详情，只显示关键结果 |
| 10.6 | Thinking Toggle | P1 | 1.5d | 显示/隐藏 AI 推理过程（extended thinking） |
| 10.7 | Sandbox Mode | P2 | 3d | Docker 容器沙箱执行 bash 命令 |
| 10.8 | Accessibility (A11y) | P2 | 2d | ARIA 标签、键盘导航、屏幕阅读器支持 |
| 10.9 | Internationalization (i18n) | P2 | 3d | 已集成 `next-intl`，完善多语言支持 |
| 10.10 | Markdown Editor | P2 | 2d | 富文本编辑模式（使用 `@mdxeditor/editor`） |
| 10.11 | Split Pane Mode | P2 | 1.5d | 左右分栏：对话 + 文件预览（已有 `react-resizable-panels`） |
| 10.12 | Command Macros | P3 | 2d | 用户可录制和回放命令序列 |

### 验收标准

- [ ] 点击麦克风按钮可语音输入
- [ ] 可切换 5+ 种视觉主题
- [ ] Brief Mode 下只显示精简输出
- [ ] Thinking Toggle 可查看 AI 推理链
- [ ] 满足 WCAG 2.1 AA 级无障碍标准

---

## 技术决策

### 核心技术栈

| 技术 | 选型 | 理由 |
|------|------|------|
| **Framework** | Next.js 16 (App Router) | RSC、SSR、API Routes 一体化 |
| **Language** | TypeScript 5 (strict) | 类型安全、开发体验好 |
| **Styling** | Tailwind CSS 4 + shadcn/ui | 开发效率高、组件丰富 |
| **State** | Zustand | 轻量、无 boilerplate、支持 middleware |
| **Database** | Prisma + SQLite (dev) / PostgreSQL (prod) | 类型安全的 ORM，平滑迁移 |
| **Runtime** | Bun | 快速启动、原生 TypeScript 支持 |
| **AI API** | NVIDIA NIM (OpenAI-compatible) | 兼容性好、模型丰富、免费额度 |
| **Model** | DeepSeek V3.1 (default) | 编码能力强、性价比高 |
| **SSE** | Native ReadableStream | 零依赖、可控性强 |
| **Command Palette** | cmdk | 轻量、快速、可定制 |

### 关键依赖决策

| 场景 | 推荐 | 备选 | 理由 |
|------|------|------|------|
| **Fuzzy Search** | fuse.js | 自实现 | 成熟、轻量 (5KB)、TypeScript 支持 |
| **WebSocket** | ws + Server-Sent Events | Socket.IO | 更轻量、协议控制更灵活 |
| **Auth** | NextAuth.js v5 | Clerk | 开源、自定义能力强 |
| **Rate Limiting** | upstash/ratelimit | 自实现 | Redis-backed、分布式支持 |
| **Sandbox** | Docker API | gVisor | 成熟、生态丰富 |
| **LSP Client** | vscode-languageclient | 自实现 | 标准协议实现 |

### 安全考量

```
┌─────────────────────────────────────────────┐
│              Security Layers                │
│                                             │
│  Layer 1: API Key 鉴权 (Gateway)            │
│  Layer 2: Rate Limiting (per user/key)      │
│  Layer 3: Permission System (tool-level)    │
│  Layer 4: Destructive Command Detection     │
│  Layer 5: Sandbox Isolation (bash/docker)   │
│  Layer 6: Input Sanitization (XSS/Injection)│
│  Layer 7: Audit Logging (全链路追踪)        │
└─────────────────────────────────────────────┘
```

---

## 多渠道架构设计

### 整体架构图

```
                          ┌─────────────┐
                          │   用户终端    │
                          │ Browser/App  │
                          │ WeChat/Slack │
                          │   DingTalk   │
                          └──────┬──────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
               HTTP/SSE      WebSocket     Bot SDK
                    │            │            │
┌───────────────────┼────────────┼────────────┼───────────────────┐
│                   ▼            ▼            ▼                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API Gateway                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │ │
│  │  │  Auth    │ │  Rate    │ │  Route   │ │   Transform  │  │ │
│  │  │Middleware│ │  Limiter │ │  Router  │ │   (Adapter)  │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────────┐ │
│  │                    Core Services                            │ │
│  │                                                              │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │ │
│  │  │ Session Manager│  │  Tool Engine   │  │ Agent Engine  │ │ │
│  │  │                │  │                │  │               │ │ │
│  │  │ - Create/Load  │  │ - bash         │  │ - explore     │ │ │
│  │  │ - Persist      │  │ - file_ops     │  │ - plan        │ │ │
│  │  │ - Share        │  │ - search       │  │ - verify      │ │ │
│  │  │ - Context Mgmt │  │ - web          │  │ - coordinator │ │ │
│  │  └────────────────┘  │ - mcp          │  └───────────────┘ │ │
│  │                      └────────────────┘                     │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────────┐ │
│  │                    AI Backend                                │ │
│  │                                                              │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │ │
│  │  │ NVIDIA NIM     │  │ Token Counter  │  │ Compaction    │ │ │
│  │  │ (Primary LLM)  │  │ & Budget Mgmt  │  │ Engine        │ │ │
│  │  └────────────────┘  └────────────────┘  └───────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Channel Adapter 设计模式

```typescript
// 统一的 Channel Adapter 接口
interface ChannelAdapter {
  // 生命周期
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // 消息处理
  onMessage(handler: (msg: ChannelMessage) => void): void;
  send(message: ChannelResponse): Promise<void>;

  // 能力查询
  capabilities: {
    streaming: boolean;
    fileUpload: boolean;
    voiceInput: boolean;
    richContent: boolean;
  };
}

// 具体实现
class BrowserAdapter implements ChannelAdapter { /* SSE + REST */ }
class WebSocketAdapter implements ChannelAdapter { /* WebSocket */ }
class WeChatAdapter implements ChannelAdapter { /* WeChat API */ }
class SlackAdapter implements ChannelAdapter { /* Slack API */ }
class DingTalkAdapter implements ChannelAdapter { /* DingTalk API */ }

// 消息格式统一
interface ChannelMessage {
  channelId: string;
  sessionId?: string;
  content: string;
  attachments?: Attachment[];
  metadata: Record<string, unknown>;
}

interface ChannelResponse {
  type: 'text' | 'markdown' | 'tool_call' | 'error';
  content: string;
  metadata?: Record<string, unknown>;
}
```

### Session 跨渠道共享

```
用户在 Browser 创建 Session A
        │
        ├── 通过 REST API 继续对话
        ├── 通过 WebSocket 实时通信
        ├── 生成 QR Code 分享给同事
        │       └── 同事在手机 PWA 上加入同一 Session
        ├── Slack Bot 转发消息到 Session A
        └── 企业微信 Bot 查询 Session A 的状态

所有渠道操作同步到同一个 Session
```

---

## 里程碑时间线

```
2025 Q3 (当前)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ v0.2.0  基础聊天 + 36 命令 + 6 工具

2025 Q3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 v0.3.0  Phase 1: Command UX 增强
🎯 v0.4.0  Phase 2: Permission 权限系统
🎯 v0.5.0  Phase 3: Context 上下文管理

2025 Q4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 v0.6.0  Phase 4: Advanced Tools
🎯 v0.7.0  Phase 5: MCP 集成
🎯 v0.8.0  Phase 6: Multi-Agent 系统

2026 Q1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 v0.9.0  Phase 7: Git & Code Intelligence
🎯 v1.0.0  Phase 8: Multi-Channel + Phase 9: Enterprise

2026 Q2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 v1.1.0  Phase 10: Advanced UX
🎯 v1.2.0  全功能完善 & 性能优化
```

### 版本发布计划

| 版本 | 包含 Phase | 主题 | 预计日期 |
|------|-----------|------|---------|
| **v0.3.0** | Phase 1 | 命令体验升级 | 2025 Q3 |
| **v0.4.0** | Phase 2 | 安全与权限 | 2025 Q3 |
| **v0.5.0** | Phase 3 | 长对话优化 | 2025 Q3 |
| **v0.6.0** | Phase 4 | 工具扩展 | 2025 Q4 |
| **v0.7.0** | Phase 5 | MCP 生态 | 2025 Q4 |
| **v0.8.0** | Phase 6 | Agent 协作 | 2025 Q4 |
| **v0.9.0** | Phase 7 | Git 集成 | 2026 Q1 |
| **v1.0.0** | Phase 8 + 9 | 多渠道 + 企业版 | 2026 Q1 |
| **v1.1.0** | Phase 10 | 高级体验 | 2026 Q2 |

---

## 附录

### A. 已知技术债务

| 债务 | 影响 | 优先级 |
|------|------|--------|
| API Key 硬编码在 `nvidia.ts` 中 | 安全风险 | P0 |
| Prisma schema 使用默认模板（User/Post） | 不匹配实际需求 | P1 |
| 非流式 tool loop 导致延迟 | 用户体验差 | P1 |
| bash 工具无输出大小限制 | 潜在内存问题 | P2 |
| 无 Error Boundary | 页面崩溃无降级 | P2 |

### B. 参考项目

| 项目 | 参考点 |
|------|--------|
| [Anthropic Claude Code](https://github.com/anthropics/claude-code) | 功能对标、源码参考 |
| [OpenClaw](https://github.com/openclaw) | 多渠道架构参考 |
| [Model Context Protocol (MCP)](https://modelcontextprotocol.io) | MCP 协议规范 |
| [Cline (VS Code)](https://github.com/cline/cline) | Web IDE Agent 参考 |

### C. 贡献指南

1. 优先完成 P0 任务
2. 每个 Phase 完成后进行 Code Review
3. 遵循 TypeScript strict 模式
4. 新工具需同时更新 `toolDefinitions` 和 `executeTool`
5. 新命令需同时更新 `commands.ts` 和 `command-handlers.ts`
6. UI 变更需兼顾移动端适配

---

> 📅 最后更新：2025-07-14
> 📝 维护者：Claude Code Web Team
> 📋 状态：Active Development (v0.2.0)
