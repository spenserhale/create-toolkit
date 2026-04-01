#!/usr/bin/env bun

/**
 * create-toolkit-vp - Scaffold a VitePlus monorepo toolkit with SDK, CLI (Stricli), and MCP (FastMCP)
 *
 * Usage:
 *   bun run create-toolkit-vp.ts <name>
 *   bun run create-toolkit-vp.ts twilio
 *   bun run create-toolkit-vp.ts cloudflare --description "Cloudflare management tools"
 *
 * Creates: <name>-toolkit/
 *   packages/sdk/    - Core SDK with types and API client
 *   packages/cli/    - Stricli-based CLI
 *   packages/mcp/    - FastMCP-based MCP server
 *
 * Uses VitePlus (vp) for unified build, test, lint, and format tooling.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    description: { type: "string", short: "d", default: "" },
    author: { type: "string", short: "a", default: "" },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

if (values.help || positionals.length === 0) {
  console.log(`
  create-toolkit-vp - Scaffold a VitePlus monorepo toolkit (SDK + CLI + MCP)

  Usage:
    bun run create-toolkit-vp.ts <name> [options]

  Arguments:
    name              Service name (e.g. twilio, stripe, cloudflare)

  Options:
    -d, --description  Short description of the toolkit
    -a, --author       Author name for package.json
    -h, --help         Show this help message

  Examples:
    bun run create-toolkit-vp.ts twilio
    bun run create-toolkit-vp.ts cloudflare -d "Cloudflare management tools"
  `);
  process.exit(0);
}

const name = positionals[0].toLowerCase();
const namePascal = name.charAt(0).toUpperCase() + name.slice(1);
const description =
  values.description || `SDK, CLI, and MCP server for ${namePascal}`;
const author = values.author || "";
const root = `${name}-toolkit`;
const scope = `@${name}-toolkit`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function writeProjectFile(relativePath: string, content: string) {
  const fullPath = join(root, relativePath);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, content.trimStart());
  console.log(`  created ${relativePath}`);
}

// ---------------------------------------------------------------------------
// Root files
// ---------------------------------------------------------------------------

const rootPackageJson = `{
  "name": "${name}-toolkit",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "vp build",
    "dev:mcp": "vp dev --filter ${scope}/mcp",
    "dev:cli": "vp dev --filter ${scope}/cli",
    "test": "vp test",
    "check": "vp check",
    "lint": "vp lint",
    "format": "vp format",
    "clean": "rm -rf packages/*/dist packages/*/node_modules node_modules"
  },
  "devDependencies": {
    "vite-plus": "latest"
  }
}
`;

const rootViteConfig = `import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // Vitest configuration
    globals: true,
  },
  lint: {
    // Oxlint configuration
  },
  fmt: {
    // Oxfmt configuration
  },
});
`;

const rootTsConfig = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  },
  "exclude": ["node_modules", "dist"]
}
`;

const rootReadme = `# ${namePascal} Toolkit

${description}

A VitePlus monorepo containing the SDK, CLI, and MCP server for the ${namePascal} API.

## Packages

| Package | Description |
|---------|-------------|
| [\`${scope}/sdk\`](./packages/sdk) | Core SDK with types, API client, and business logic |
| [\`${scope}/cli\`](./packages/cli) | Command-line interface (Stricli) |
| [\`${scope}/mcp\`](./packages/mcp) | MCP server for AI assistants (FastMCP) |

## Getting Started

\`\`\`bash
# Install dependencies
bun install

# Build all packages
vp build

# Run the CLI
vp dev --filter ${scope}/cli -- --help

# Run the MCP server (stdio mode for Claude Desktop)
vp dev --filter ${scope}/mcp
\`\`\`

## Architecture

\`\`\`
packages/sdk/     <-- Types, API client, business logic (foundation)
    ^       ^
    |       |
packages/cli/   packages/mcp/
    (Stricli)    (FastMCP)
\`\`\`

Both the CLI and MCP server are thin wrappers over the SDK. If the REST API
changes, you update the SDK and both consumers get the fix automatically.

## Development

\`\`\`bash
# Run tests across all packages
vp test

# Lint and format
vp check

# Build a specific package
vp build --filter ${scope}/sdk
\`\`\`

## Adding a New API Operation

1. Add types to \`packages/sdk/src/types.ts\`
2. Add the client method to \`packages/sdk/src/client.ts\`
3. Add a CLI command in \`packages/cli/src/commands/\`
4. Add an MCP tool in \`packages/mcp/src/tools/\`
`;

const gitignore = `node_modules/
dist/
.env
.env.local
*.tsbuildinfo
.vite/
`;

const envExample = `# ${namePascal} API Configuration
${name.toUpperCase()}_API_KEY=your-api-key-here
${name.toUpperCase()}_BASE_URL=https://api.${name}.com
`;

// ---------------------------------------------------------------------------
// SDK package
// ---------------------------------------------------------------------------

const sdkPackageJson = `{
  "name": "${scope}/sdk",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.24.0"
  }
}
`;

const sdkTsConfig = `{
  "extends": "../../tsconfig.json",
  "include": ["src"]
}
`;

const sdkTypes = `import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const ${namePascal}ConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().default("https://api.${name}.com"),
});

export type ${namePascal}Config = z.infer<typeof ${namePascal}ConfigSchema>;

// ---------------------------------------------------------------------------
// API Resource schemas -- add your own here
// ---------------------------------------------------------------------------

export const ResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Resource = z.infer<typeof ResourceSchema>;

export const ListResourcesParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type ListResourcesParams = z.infer<typeof ListResourcesParamsSchema>;

export const CreateResourceParamsSchema = z.object({
  name: z.string().min(1),
});

export type CreateResourceParams = z.infer<typeof CreateResourceParamsSchema>;

// ---------------------------------------------------------------------------
// API Response wrappers
// ---------------------------------------------------------------------------

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  });

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
`;

const sdkErrors = `export class ${namePascal}Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "${namePascal}Error";
  }
}

export class ${namePascal}AuthError extends ${namePascal}Error {
  constructor(message = "Authentication failed. Check your API key.") {
    super(message, "AUTH_ERROR", 401);
    this.name = "${namePascal}AuthError";
  }
}

export class ${namePascal}NotFoundError extends ${namePascal}Error {
  constructor(resource: string, id: string) {
    super(\`\${resource} with id "\${id}" not found\`, "NOT_FOUND", 404);
    this.name = "${namePascal}NotFoundError";
  }
}
`;

const sdkClient = `import type {
  ${namePascal}Config,
  Resource,
  ListResourcesParams,
  CreateResourceParams,
  PaginatedResponse,
} from "./types.js";
import {
  ${namePascal}ConfigSchema,
  ResourceSchema,
  PaginatedResponseSchema,
  ErrorResponseSchema,
} from "./types.js";
import { ${namePascal}Error, ${namePascal}AuthError } from "./errors.js";

export class ${namePascal}Client {
  private readonly config: ${namePascal}Config;

  constructor(config: Partial<${namePascal}Config> & { apiKey: string }) {
    this.config = ${namePascal}ConfigSchema.parse(config);
  }

  // -------------------------------------------------------------------------
  // HTTP helpers
  // -------------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = \`\${this.config.baseUrl}\${path}\`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${this.config.apiKey}\`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      if (res.status === 401) throw new ${namePascal}AuthError();

      const errorBody = await res.json().catch(() => null);
      const parsed = ErrorResponseSchema.safeParse(errorBody);

      throw new ${namePascal}Error(
        parsed.success ? parsed.data.error.message : \`HTTP \${res.status}\`,
        parsed.success ? parsed.data.error.code : "UNKNOWN",
        res.status
      );
    }

    return res.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Resource operations -- add your own here
  // -------------------------------------------------------------------------

  async listResources(
    params: ListResourcesParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Resource>> {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    return this.request("GET", \`/resources?\${query}\`);
  }

  async getResource(id: string): Promise<Resource> {
    return this.request("GET", \`/resources/\${id}\`);
  }

  async createResource(params: CreateResourceParams): Promise<Resource> {
    return this.request("POST", "/resources", params);
  }

  async deleteResource(id: string): Promise<void> {
    await this.request("DELETE", \`/resources/\${id}\`);
  }
}
`;

const sdkConfig = `import type { ${namePascal}Config } from "./types.js";

/**
 * Resolve configuration from environment variables.
 * Useful for both CLI and MCP contexts.
 */
export function resolveConfig(
  overrides: Partial<${namePascal}Config> = {}
): ${namePascal}Config {
  return {
    apiKey: overrides.apiKey ?? process.env.${name.toUpperCase()}_API_KEY ?? "",
    baseUrl:
      overrides.baseUrl ??
      process.env.${name.toUpperCase()}_BASE_URL ??
      "https://api.${name}.com",
  };
}
`;

const sdkIndex = `export { ${namePascal}Client } from "./client.js";
export { resolveConfig } from "./config.js";
export { ${namePascal}Error, ${namePascal}AuthError, ${namePascal}NotFoundError } from "./errors.js";
export type {
  ${namePascal}Config,
  Resource,
  ListResourcesParams,
  CreateResourceParams,
  PaginatedResponse,
  ErrorResponse,
} from "./types.js";
export {
  ${namePascal}ConfigSchema,
  ResourceSchema,
  ListResourcesParamsSchema,
  CreateResourceParamsSchema,
  ErrorResponseSchema,
} from "./types.js";
`;

const sdkTest = `import { describe, expect, it } from "vitest";
import { ${namePascal}Client } from "../src/client.js";

describe("${namePascal}Client", () => {
  it("should require an API key", () => {
    expect(() => new ${namePascal}Client({ apiKey: "" })).toThrow();
  });

  it("should accept a valid config", () => {
    const client = new ${namePascal}Client({
      apiKey: "test-key",
      baseUrl: "https://api.example.com",
    });
    expect(client).toBeDefined();
  });
});
`;

// ---------------------------------------------------------------------------
// CLI package (Stricli)
// ---------------------------------------------------------------------------

const cliPackageJson = `{
  "name": "${scope}/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "${name}": "src/bin.ts"
  },
  "dependencies": {
    "${scope}/sdk": "workspace:*",
    "@stricli/core": "^1.0.0"
  }
}
`;

const cliTsConfig = `{
  "extends": "../../tsconfig.json",
  "include": ["src"]
}
`;

const cliBin = `#!/usr/bin/env bun
import { run } from "@stricli/core";
import { app } from "./app.js";

await run(app, process.argv.slice(2), {
  process,
});
`;

const cliApp = `import { buildApplication, buildRouteMap } from "@stricli/core";
import { listCommand } from "./commands/list.js";
import { getCommand } from "./commands/get.js";
import { createCommand } from "./commands/create.js";
import { deleteCommand } from "./commands/delete.js";

const resourceRoutes = buildRouteMap({
  routes: {
    list: listCommand,
    get: getCommand,
    create: createCommand,
    delete: deleteCommand,
  },
  docs: {
    brief: "Manage ${namePascal} resources",
  },
});

const routes = buildRouteMap({
  routes: {
    resources: resourceRoutes,
  },
  docs: {
    brief: "${description}",
  },
});

export const app = buildApplication(routes, {
  name: "${name}",
  versionInfo: {
    currentVersion: "0.1.0",
  },
});
`;

const cliListCommand = `import { buildCommand } from "@stricli/core";
import { ${namePascal}Client, resolveConfig } from "${scope}/sdk";

interface ListFlags {
  readonly page: number;
  readonly limit: number;
  readonly json: boolean;
}

export const listCommand = buildCommand({
  docs: {
    brief: "List resources",
  },
  parameters: {
    flags: {
      page: {
        kind: "parsed",
        parse: Number,
        brief: "Page number",
        default: 1,
      },
      limit: {
        kind: "parsed",
        parse: Number,
        brief: "Items per page",
        default: 20,
      },
      json: {
        kind: "boolean",
        brief: "Output as JSON",
        default: false,
      },
    },
  },
  async func(this: void, flags: ListFlags) {
    const config = resolveConfig();
    const client = new ${namePascal}Client(config);

    try {
      const result = await client.listResources({
        page: flags.page,
        limit: flags.limit,
      });

      if (flags.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(\`Showing \${result.data.length} of \${result.total} resources (page \${result.page})\\n\`);
      for (const item of result.data) {
        console.log(\`  \${item.id}  \${item.name}\`);
      }
    } catch (err) {
      console.error(\`Error: \${err instanceof Error ? err.message : err}\`);
      process.exit(1);
    }
  },
});
`;

const cliGetCommand = `import { buildCommand } from "@stricli/core";
import { ${namePascal}Client, resolveConfig } from "${scope}/sdk";

interface GetFlags {
  readonly json: boolean;
}

export const getCommand = buildCommand({
  docs: {
    brief: "Get a resource by ID",
  },
  parameters: {
    flags: {
      json: {
        kind: "boolean",
        brief: "Output as JSON",
        default: false,
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Resource ID",
          parse: String,
        },
      ],
    },
  },
  async func(this: void, flags: GetFlags, id: string) {
    const config = resolveConfig();
    const client = new ${namePascal}Client(config);

    try {
      const resource = await client.getResource(id);

      if (flags.json) {
        console.log(JSON.stringify(resource, null, 2));
        return;
      }

      console.log(\`ID:        \${resource.id}\`);
      console.log(\`Name:      \${resource.name}\`);
      console.log(\`Created:   \${resource.createdAt}\`);
      console.log(\`Updated:   \${resource.updatedAt}\`);
    } catch (err) {
      console.error(\`Error: \${err instanceof Error ? err.message : err}\`);
      process.exit(1);
    }
  },
});
`;

const cliCreateCommand = `import { buildCommand } from "@stricli/core";
import { ${namePascal}Client, resolveConfig } from "${scope}/sdk";

interface CreateFlags {
  readonly json: boolean;
}

export const createCommand = buildCommand({
  docs: {
    brief: "Create a new resource",
  },
  parameters: {
    flags: {
      json: {
        kind: "boolean",
        brief: "Output as JSON",
        default: false,
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Resource name",
          parse: String,
        },
      ],
    },
  },
  async func(this: void, flags: CreateFlags, name: string) {
    const config = resolveConfig();
    const client = new ${namePascal}Client(config);

    try {
      const resource = await client.createResource({ name });

      if (flags.json) {
        console.log(JSON.stringify(resource, null, 2));
        return;
      }

      console.log(\`Created resource: \${resource.id} (\${resource.name})\`);
    } catch (err) {
      console.error(\`Error: \${err instanceof Error ? err.message : err}\`);
      process.exit(1);
    }
  },
});
`;

const cliDeleteCommand = `import { buildCommand } from "@stricli/core";
import { ${namePascal}Client, resolveConfig } from "${scope}/sdk";

export const deleteCommand = buildCommand({
  docs: {
    brief: "Delete a resource by ID",
  },
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Resource ID",
          parse: String,
        },
      ],
    },
  },
  async func(this: void, _flags: {}, id: string) {
    const config = resolveConfig();
    const client = new ${namePascal}Client(config);

    try {
      await client.deleteResource(id);
      console.log(\`Deleted resource: \${id}\`);
    } catch (err) {
      console.error(\`Error: \${err instanceof Error ? err.message : err}\`);
      process.exit(1);
    }
  },
});
`;

// ---------------------------------------------------------------------------
// MCP package (FastMCP)
// ---------------------------------------------------------------------------

const mcpPackageJson = `{
  "name": "${scope}/mcp",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "dependencies": {
    "${scope}/sdk": "workspace:*",
    "fastmcp": "^3.0.0",
    "zod": "^3.24.0"
  }
}
`;

const mcpTsConfig = `{
  "extends": "../../tsconfig.json",
  "include": ["src"]
}
`;

const mcpIndex = `import { FastMCP } from "fastmcp";
import { registerResourceTools } from "./tools/resources.js";

const server = new FastMCP({
  name: "${name}-toolkit",
  version: "0.1.0",
});

// Register tool groups
registerResourceTools(server);

// Start the server in stdio mode (for Claude Desktop, Cursor, etc.)
server.start({
  transportType: "stdio",
});
`;

const mcpResourceTools = `import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { ${namePascal}Client, resolveConfig } from "${scope}/sdk";

function getClient(): ${namePascal}Client {
  const config = resolveConfig();
  return new ${namePascal}Client(config);
}

export function registerResourceTools(server: FastMCP) {
  server.addTool({
    name: "list_resources",
    description: "List ${namePascal} resources with pagination",
    parameters: z.object({
      page: z.number().int().positive().default(1).describe("Page number"),
      limit: z
        .number()
        .int()
        .positive()
        .max(100)
        .default(20)
        .describe("Items per page"),
    }),
    execute: async (args) => {
      const client = getClient();
      const result = await client.listResources({
        page: args.page,
        limit: args.limit,
      });

      return JSON.stringify(result, null, 2);
    },
  });

  server.addTool({
    name: "get_resource",
    description: "Get a ${namePascal} resource by its ID",
    parameters: z.object({
      id: z.string().describe("The resource ID"),
    }),
    execute: async (args) => {
      const client = getClient();
      const resource = await client.getResource(args.id);
      return JSON.stringify(resource, null, 2);
    },
  });

  server.addTool({
    name: "create_resource",
    description: "Create a new ${namePascal} resource",
    parameters: z.object({
      name: z.string().min(1).describe("Name for the new resource"),
    }),
    execute: async (args) => {
      const client = getClient();
      const resource = await client.createResource({ name: args.name });
      return JSON.stringify(resource, null, 2);
    },
  });

  server.addTool({
    name: "delete_resource",
    description: "Delete a ${namePascal} resource by its ID",
    parameters: z.object({
      id: z.string().describe("The resource ID to delete"),
    }),
    execute: async (args) => {
      const client = getClient();
      await client.deleteResource(args.id);
      return \`Successfully deleted resource \${args.id}\`;
    },
  });
}
`;

const mcpReadme = `# ${scope}/mcp

MCP server for ${namePascal}, built with [FastMCP](https://github.com/punkpeye/fastmcp).

## Tools

| Tool | Description |
|------|-------------|
| \`list_resources\` | List resources with pagination |
| \`get_resource\` | Get a resource by ID |
| \`create_resource\` | Create a new resource |
| \`delete_resource\` | Delete a resource |

## Setup with Claude Desktop

Add this to your Claude Desktop config (\`~/Library/Application Support/Claude/claude_desktop_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "${name}-toolkit": {
      "command": "bun",
      "args": ["run", "${process.cwd()}/${root}/packages/mcp/src/index.ts"],
      "env": {
        "${name.toUpperCase()}_API_KEY": "your-api-key-here"
      }
    }
  }
}
\`\`\`

## Development

\`\`\`bash
# Run in stdio mode
vp dev --filter ${scope}/mcp

# Inspect with FastMCP inspector
npx fastmcp inspect src/index.ts
\`\`\`
`;

// ---------------------------------------------------------------------------
// Write all files
// ---------------------------------------------------------------------------

console.log(`\nScaffolding ${root}/ (VitePlus)\n`);

// Root
await writeProjectFile("package.json", rootPackageJson);
await writeProjectFile("vite.config.ts", rootViteConfig);
await writeProjectFile("tsconfig.json", rootTsConfig);
await writeProjectFile("README.md", rootReadme);
await writeProjectFile(".gitignore", gitignore);
await writeProjectFile(".env.example", envExample);

// SDK
await writeProjectFile("packages/sdk/package.json", sdkPackageJson);
await writeProjectFile("packages/sdk/tsconfig.json", sdkTsConfig);
await writeProjectFile("packages/sdk/src/index.ts", sdkIndex);
await writeProjectFile("packages/sdk/src/types.ts", sdkTypes);
await writeProjectFile("packages/sdk/src/client.ts", sdkClient);
await writeProjectFile("packages/sdk/src/config.ts", sdkConfig);
await writeProjectFile("packages/sdk/src/errors.ts", sdkErrors);
await writeProjectFile("packages/sdk/tests/client.test.ts", sdkTest);

// CLI
await writeProjectFile("packages/cli/package.json", cliPackageJson);
await writeProjectFile("packages/cli/tsconfig.json", cliTsConfig);
await writeProjectFile("packages/cli/src/bin.ts", cliBin);
await writeProjectFile("packages/cli/src/app.ts", cliApp);
await writeProjectFile("packages/cli/src/commands/list.ts", cliListCommand);
await writeProjectFile("packages/cli/src/commands/get.ts", cliGetCommand);
await writeProjectFile("packages/cli/src/commands/create.ts", cliCreateCommand);
await writeProjectFile("packages/cli/src/commands/delete.ts", cliDeleteCommand);

// MCP
await writeProjectFile("packages/mcp/package.json", mcpPackageJson);
await writeProjectFile("packages/mcp/tsconfig.json", mcpTsConfig);
await writeProjectFile("packages/mcp/src/index.ts", mcpIndex);
await writeProjectFile("packages/mcp/src/tools/resources.ts", mcpResourceTools);
await writeProjectFile("packages/mcp/README.md", mcpReadme);

console.log(`
Done! Next steps:

  cd ${root}
  bun install
  cp .env.example .env     # add your API key
  vp dev --filter ${scope}/cli -- --help
  vp dev --filter ${scope}/mcp

Happy building!
`);
