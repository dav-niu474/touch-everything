import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

// ─── Working directory ───────────────────────────────────────────────────────

const WORKING_DIR = '/home/z/my-project';

// ─── Tool Definitions (OpenAI function calling format) ───────────────────────

export const toolDefinitions = [
  {
    type: 'function' as const,
    function: {
      name: 'bash',
      description:
        'Execute a shell command and return the output. Use this for running build commands, checking git status, installing packages, running tests, etc. Commands run in the project directory.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute',
          },
          description: {
            type: 'string',
            description: 'Brief description of what this command does',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'file_read',
      description:
        'Read the contents of a file. Returns the file content as text. Use this to examine existing code, config files, logs, etc.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute or relative path to the file to read',
          },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'file_write',
      description:
        'Write content to a file, creating it if it does not exist or overwriting it entirely if it does. Use this for creating new files or completely rewriting existing ones.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute or relative path to the file to write',
          },
          content: {
            type: 'string',
            description: 'The full content to write to the file',
          },
        },
        required: ['file_path', 'content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'file_edit',
      description:
        'Edit a file by finding and replacing a specific string. The old_string must match exactly (including whitespace and indentation). Use this for making targeted edits to existing files.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute or relative path to the file to edit',
          },
          old_string: {
            type: 'string',
            description: 'The exact string to find and replace. Must match exactly including whitespace.',
          },
          new_string: {
            type: 'string',
            description: 'The string to replace old_string with',
          },
        },
        required: ['file_path', 'old_string', 'new_string'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'glob_search',
      description:
        'Search for files by name pattern using glob syntax (e.g., "**/*.ts", "src/**/*.tsx"). Returns matching file paths.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The glob pattern to search for files',
          },
          directory: {
            type: 'string',
            description: 'The directory to search in (defaults to project root)',
          },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'grep_search',
      description:
        'Search for a pattern in file contents using regex. Returns matching lines with file paths and line numbers.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The regex pattern to search for in file contents',
          },
          file_path: {
            type: 'string',
            description:
              'The file or directory to search in. If a directory, searches all files recursively.',
          },
          include: {
            type: 'string',
            description:
              'Optional file pattern to include (e.g., "*.ts", "*.tsx")',
          },
        },
        required: ['pattern', 'file_path'],
      },
    },
  },
];

// ─── Tool Executors ──────────────────────────────────────────────────────────

function resolvePath(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(WORKING_DIR, filePath);
}

async function executeBash(
  args: { command: string; description?: string }
): Promise<ToolResult> {
  const { command } = args;
  return new Promise((resolve) => {
    const timeout = 30000;
    exec(
      command,
      {
        cwd: WORKING_DIR,
        timeout,
        maxBuffer: 1024 * 1024, // 1MB buffer
      },
      (error, stdout, stderr) => {
        if (error && error.killed) {
          resolve({
            success: false,
            output: '',
            error: `Command timed out after ${timeout / 1000}s`,
          });
          return;
        }
        if (error) {
          resolve({
            success: false,
            output: stdout || '',
            error: `Exit code ${error.code}: ${stderr || error.message}`,
          });
          return;
        }
        resolve({
          success: true,
          output: stdout || stderr || '(no output)',
        });
      }
    );
  });
}

async function executeFileRead(args: {
  file_path: string;
}): Promise<ToolResult> {
  try {
    const filePath = resolvePath(args.file_path);
    const content = await fs.readFile(filePath, 'utf-8');
    // Truncate very large files
    const lines = content.split('\n');
    if (lines.length > 2000) {
      return {
        success: true,
        output: lines.slice(0, 2000).join('\n') + '\n\n... (file truncated, showing first 2000 lines)',
      };
    }
    return { success: true, output: content };
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    return {
      success: false,
      output: '',
      error: `Failed to read file: ${err.message || String(error)}`,
    };
  }
}

async function executeFileWrite(args: {
  file_path: string;
  content: string;
}): Promise<ToolResult> {
  try {
    const filePath = resolvePath(args.file_path);
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, args.content, 'utf-8');
    return {
      success: true,
      output: `Successfully wrote ${args.content.length} characters to ${args.file_path}`,
    };
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    return {
      success: false,
      output: '',
      error: `Failed to write file: ${err.message || String(error)}`,
    };
  }
}

async function executeFileEdit(args: {
  file_path: string;
  old_string: string;
  new_string: string;
}): Promise<ToolResult> {
  try {
    const filePath = resolvePath(args.file_path);
    const content = await fs.readFile(filePath, 'utf-8');

    if (!content.includes(args.old_string)) {
      // Try to give a helpful error with context
      const preview = content.substring(0, 200);
      return {
        success: false,
        output: '',
        error: `Could not find the exact string to replace. File starts with:\n${preview}...`,
      };
    }

    // Check for multiple occurrences
    const occurrences = content.split(args.old_string).length - 1;
    if (occurrences > 1) {
      return {
        success: false,
        output: '',
        error: `Found ${occurrences} occurrences of the string. Please make old_string more specific to match only one occurrence.`,
      };
    }

    const newContent = content.replace(args.old_string, args.new_string);
    await fs.writeFile(filePath, newContent, 'utf-8');

    return {
      success: true,
      output: `Successfully edited ${args.file_path}. Replaced 1 occurrence.`,
    };
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    return {
      success: false,
      output: '',
      error: `Failed to edit file: ${err.message || String(error)}`,
    };
  }
}

async function executeGlobSearch(args: {
  pattern: string;
  directory?: string;
}): Promise<ToolResult> {
  try {
    const searchDir = args.directory
      ? resolvePath(args.directory)
      : WORKING_DIR;

    // Use find command for glob search - widely available on Unix systems
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Convert glob pattern to find-compatible pattern
    // Simple conversion: **/*.ts -> -name "*.ts", etc.
    const pattern = args.pattern;

    // Use find with the pattern
    // Escape special characters for shell
    const escapedDir = searchDir.replace(/"/g, '\\"');
    const cmd = `find "${escapedDir}" -type f -name "${pattern}" 2>/dev/null | head -100`;

    const { stdout } = await execAsync(cmd, { timeout: 15000 });

    const files = stdout
      .split('\n')
      .filter((f: string) => {
        if (!f.trim()) return false;
        // Skip common ignored paths
        if (f.includes('node_modules') || f.includes('.next') || f.includes('.git') || f.includes('dist')) return false;
        return true;
      })
      .map((f: string) => path.relative(WORKING_DIR, f.trim()));

    if (files.length === 0) {
      return {
        success: true,
        output: `No files found matching pattern "${args.pattern}"`,
      };
    }

    return {
      success: true,
      output: files.join('\n'),
    };
  } catch (error: unknown) {
    return {
      success: false,
      output: '',
      error: `Glob search failed: ${String(error)}`,
    };
  }
}

async function executeGrepSearch(args: {
  pattern: string;
  file_path: string;
  include?: string;
}): Promise<ToolResult> {
  try {
    const targetPath = resolvePath(args.file_path);
    const regex = new RegExp(args.pattern, 'g');
    const results: string[] = [];
    let totalMatches = 0;
    const MAX_MATCHES = 200;

    async function searchFile(filePath: string): Promise<void> {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (totalMatches >= MAX_MATCHES) return;
          regex.lastIndex = 0;
          if (regex.test(lines[i])) {
            const relativePath = path.relative(WORKING_DIR, filePath);
            results.push(`${relativePath}:${i + 1}: ${lines[i].trim()}`);
            totalMatches++;
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    async function searchDir(dirPath: string): Promise<void> {
      const stat = await fs.stat(dirPath).catch(() => null);
      if (!stat || !stat.isDirectory()) return;

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (totalMatches >= MAX_MATCHES) return;
        const fullPath = path.join(dirPath, entry.name);

        // Skip common ignored directories
        if (
          entry.name === 'node_modules' ||
          entry.name === '.next' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === '.prisma'
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          await searchDir(fullPath);
        } else if (entry.isFile()) {
          // Apply include filter
          if (args.include) {
            const ext = path.extname(entry.name);
            const pattern = args.include.replace(/^\*/, '');
            if (pattern !== ext && args.include !== `*.${entry.name}`) {
              continue;
            }
          }
          await searchFile(fullPath);
        }
      }
    }

    const stat = await fs.stat(targetPath).catch(() => null);
    if (stat?.isFile()) {
      await searchFile(targetPath);
    } else if (stat?.isDirectory()) {
      await searchDir(targetPath);
    } else {
      return {
        success: false,
        output: '',
        error: `Path not found: ${args.file_path}`,
      };
    }

    if (results.length === 0) {
      return {
        success: true,
        output: `No matches found for pattern "${args.pattern}"`,
      };
    }

    const output =
      results.length >= MAX_MATCHES
        ? results.join('\n') +
          `\n\n... (results truncated at ${MAX_MATCHES} matches)`
        : results.join('\n');

    return { success: true, output };
  } catch (error: unknown) {
    return {
      success: false,
      output: '',
      error: `Grep search failed: ${String(error)}`,
    };
  }
}

// ─── Tool Dispatcher ─────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  argumentsStr: string
): Promise<ToolResult> {
  let args: Record<string, unknown>;

  try {
    args = JSON.parse(argumentsStr);
  } catch {
    return {
      success: false,
      output: '',
      error: `Failed to parse tool arguments: ${argumentsStr}`,
    };
  }

  switch (name) {
    case 'bash':
      return executeBash(args as { command: string; description?: string });
    case 'file_read':
      return executeFileRead(args as { file_path: string });
    case 'file_write':
      return executeFileWrite(args as { file_path: string; content: string });
    case 'file_edit':
      return executeFileEdit(
        args as { file_path: string; old_string: string; new_string: string }
      );
    case 'glob_search':
      return executeGlobSearch(
        args as { pattern: string; directory?: string }
      );
    case 'grep_search':
      return executeGrepSearch(
        args as { pattern: string; file_path: string; include?: string }
      );
    default:
      return {
        success: false,
        output: '',
        error: `Unknown tool: ${name}`,
      };
  }
}
