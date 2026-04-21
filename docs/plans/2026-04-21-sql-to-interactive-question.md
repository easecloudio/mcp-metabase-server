# SQL to Interactive Question — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add schema caching and two MCP tools (`get_schema_cache`, `refresh_schema_cache`) that let Claude convert a native SQL card into an MBQL-based interactive question in Metabase.

**Architecture:** A new `src/cache/schema-cache.ts` module manages read/write of per-database schema files under `~/.easecloud/metabase-mcp/cache/{url-hash}/`. A new `src/handlers/schema-cache-tools.ts` exposes two MCP tools that auto-populate the cache from the Metabase API when missing or stale, then return field-ID-annotated schema for Claude to use during SQL→MBQL translation. The existing `create_card` tool is used unchanged to save the result.

**Tech Stack:** TypeScript, Node.js `fs/promises` + `crypto` (stdlib), existing `MetabaseClient.apiCall`, MCP SDK `Tool` type.

---

## Background: How Claude orchestrates the conversion

When a user asks "convert card 42 to an interactive question", Claude:

1. Calls `get_card(42)` → gets `dataset_query.native.query` (SQL) + `database_id`
2. Calls `get_schema_cache(database_id)` → gets tables + field IDs from `~/.easecloud/`
3. Translates SQL → MBQL using cached field IDs (Claude does this, no API needed)
4. Calls `create_card(mbql_payload)` → saves the new interactive question

MBQL field references look like `["field", 42, null]` where `42` is the Metabase field ID. The cache is what makes step 3 possible without hitting the API on every conversion.

---

## Task 1: Cache module (`src/cache/schema-cache.ts`)

**Files:**
- Create: `metabase-server/src/cache/schema-cache.ts`

**Schema of a cached file** (`~/.easecloud/metabase-mcp/cache/{urlHash}/database_{id}.json`):
```json
{
  "cached_at": "2026-04-21T10:00:00.000Z",
  "metabase_url": "http://localhost:3000",
  "database_id": 3,
  "database_name": "Production DB",
  "tables": [
    {
      "id": 12,
      "name": "orders",
      "display_name": "Orders",
      "schema": "public",
      "fields": [
        {
          "id": 42,
          "name": "user_id",
          "display_name": "User ID",
          "base_type": "type/Integer",
          "semantic_type": "type/FK"
        }
      ]
    }
  ]
}
```

**Step 1: Write the cache module**

```typescript
// src/cache/schema-cache.ts
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import * as os from "os";

export interface CachedField {
  id: number;
  name: string;
  display_name: string;
  base_type: string;
  semantic_type: string | null;
}

export interface CachedTable {
  id: number;
  name: string;
  display_name: string;
  schema: string | null;
  fields: CachedField[];
}

export interface DatabaseSchema {
  cached_at: string;
  metabase_url: string;
  database_id: number;
  database_name: string;
  tables: CachedTable[];
}

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCacheDir(metabaseUrl: string): string {
  const urlHash = crypto
    .createHash("sha256")
    .update(metabaseUrl)
    .digest("hex")
    .slice(0, 12);
  return path.join(os.homedir(), ".easecloud", "metabase-mcp", "cache", urlHash);
}

function getCacheFilePath(metabaseUrl: string, databaseId: number): string {
  return path.join(getCacheDir(metabaseUrl), `database_${databaseId}.json`);
}

export async function readSchemaCache(
  metabaseUrl: string,
  databaseId: number
): Promise<DatabaseSchema | null> {
  const filePath = getCacheFilePath(metabaseUrl, databaseId);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const schema: DatabaseSchema = JSON.parse(raw);
    const age = Date.now() - new Date(schema.cached_at).getTime();
    if (age > TTL_MS) return null; // stale
    return schema;
  } catch {
    return null; // file missing or corrupt
  }
}

export async function writeSchemaCache(
  metabaseUrl: string,
  schema: DatabaseSchema
): Promise<void> {
  const filePath = getCacheFilePath(metabaseUrl, schema.database_id);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(schema, null, 2), "utf-8");
}

export async function deleteSchemaCache(
  metabaseUrl: string,
  databaseId: number
): Promise<void> {
  const filePath = getCacheFilePath(metabaseUrl, databaseId);
  try {
    await fs.unlink(filePath);
  } catch {
    // already gone — no-op
  }
}

export function isCacheStale(schema: DatabaseSchema): boolean {
  return Date.now() - new Date(schema.cached_at).getTime() > TTL_MS;
}

export function getCachePath(metabaseUrl: string): string {
  return getCacheDir(metabaseUrl);
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd metabase-server && npm run build 2>&1 | head -30
```
Expected: no errors referencing `schema-cache.ts`

**Step 3: Commit**

```bash
git add metabase-server/src/cache/schema-cache.ts
git commit -m "feat(cache): add schema cache read/write module for ~/.easecloud"
```

---

## Task 2: Add `getDatabaseMetadata` to MetabaseClient

**Files:**
- Modify: `metabase-server/src/client/metabase-client.ts`

The existing `apiCall("GET", /api/database/${id}/metadata)` already works but returns `any`. Add a typed wrapper so the cache layer can use it cleanly.

**Step 1: Add the method** — insert after `getDatabase` (line ~213):

```typescript
async getDatabaseMetadata(id: number): Promise<any> {
  await this.ensureAuthenticated();
  const response = await this.axiosInstance.get(`/api/database/${id}/metadata`);
  return response.data;
}
```

**Step 2: Build**

```bash
cd metabase-server && npm run build 2>&1 | head -20
```
Expected: clean build

**Step 3: Commit**

```bash
git add metabase-server/src/client/metabase-client.ts
git commit -m "feat(client): add getDatabaseMetadata method"
```

---

## Task 3: Schema cache tool handlers (`src/handlers/schema-cache-tools.ts`)

**Files:**
- Create: `metabase-server/src/handlers/schema-cache-tools.ts`

This handler exposes two tools:

- `get_schema_cache(database_id)` — returns cached schema (auto-fetches from Metabase if cache is missing or stale). This is the primary tool Claude calls before translating SQL → MBQL.
- `refresh_schema_cache(database_id?)` — force-refresh one database or all cached databases for this instance.

**Step 1: Write the handler**

```typescript
// src/handlers/schema-cache-tools.ts
import { MetabaseClient } from "../client/metabase-client.js";
import { ErrorCode, McpError } from "../types/errors.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  DatabaseSchema,
  CachedTable,
  CachedField,
  readSchemaCache,
  writeSchemaCache,
  isCacheStale,
  getCachePath,
} from "../cache/schema-cache.js";

export class SchemaCacheToolHandlers {
  constructor(
    private client: MetabaseClient,
    private metabaseUrl: string
  ) {}

  getToolSchemas(): Tool[] {
    return [
      {
        name: "get_schema_cache",
        description:
          "Get cached database schema (tables + field IDs) for a Metabase database. " +
          "Auto-fetches from Metabase if cache is missing or older than 24h. " +
          "Use this BEFORE translating SQL to MBQL — field IDs in the response are required for MBQL field references like [\"field\", 42, null].",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "number",
              description: "ID of the Metabase database to get schema for",
            },
          },
          required: ["database_id"],
        },
      },
      {
        name: "refresh_schema_cache",
        description:
          "Force-refresh the local schema cache for one or all databases. " +
          "Use when you suspect the cache is outdated (e.g. after a schema migration).",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "number",
              description:
                "ID of the database to refresh. Omit to refresh all cached databases.",
            },
          },
        },
      },
    ];
  }

  async handleTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "get_schema_cache":
        return await this.getSchemaCache(args);
      case "refresh_schema_cache":
        return await this.refreshSchemaCache(args);
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown schema cache tool: ${name}`
        );
    }
  }

  private async getSchemaCache(args: any): Promise<any> {
    const { database_id } = args;
    if (!database_id) {
      throw new McpError(ErrorCode.InvalidParams, "database_id is required");
    }

    let schema = await readSchemaCache(this.metabaseUrl, database_id);

    if (!schema) {
      schema = await this.fetchAndCache(database_id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { ...schema, cache_status: "fetched_fresh" },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...schema,
              cache_status: isCacheStale(schema) ? "stale_served" : "fresh",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async refreshSchemaCache(args: any): Promise<any> {
    const { database_id } = args;

    if (database_id) {
      const schema = await this.fetchAndCache(database_id);
      return {
        content: [
          {
            type: "text",
            text: `Schema cache refreshed for database ${database_id} ("${schema.database_name}"). ${schema.tables.length} tables cached.`,
          },
        ],
      };
    }

    // Refresh all: fetch database list, then cache each
    const databases = await this.client.getDatabases();
    const results: string[] = [];
    for (const db of databases as any[]) {
      try {
        const schema = await this.fetchAndCache(db.id);
        results.push(`✓ database ${db.id} ("${schema.database_name}"): ${schema.tables.length} tables`);
      } catch (err: any) {
        results.push(`✗ database ${db.id}: ${err.message}`);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Schema cache refresh complete:\n${results.join("\n")}\n\nCache location: ${getCachePath(this.metabaseUrl)}`,
        },
      ],
    };
  }

  private async fetchAndCache(databaseId: number): Promise<DatabaseSchema> {
    const metadata = await this.client.getDatabaseMetadata(databaseId);

    const tables: CachedTable[] = (metadata.tables ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      display_name: t.display_name,
      schema: t.schema ?? null,
      fields: (t.fields ?? []).map((f: any): CachedField => ({
        id: f.id,
        name: f.name,
        display_name: f.display_name,
        base_type: f.base_type,
        semantic_type: f.semantic_type ?? null,
      })),
    }));

    const schema: DatabaseSchema = {
      cached_at: new Date().toISOString(),
      metabase_url: this.metabaseUrl,
      database_id: metadata.id,
      database_name: metadata.name,
      tables,
    };

    await writeSchemaCache(this.metabaseUrl, schema);
    return schema;
  }
}
```

**Step 2: Build**

```bash
cd metabase-server && npm run build 2>&1 | head -30
```
Expected: clean

**Step 3: Commit**

```bash
git add metabase-server/src/handlers/schema-cache-tools.ts
git commit -m "feat(handlers): add get_schema_cache and refresh_schema_cache tools"
```

---

## Task 4: Wire into ToolRegistry

**Files:**
- Modify: `metabase-server/src/handlers/tool-registry.ts`
- Modify: `metabase-server/src/utils/config.ts` (verify `METABASE_URL` is exported)

**Step 1: Check how config exposes the URL**

```bash
grep -n "METABASE_URL\|metabaseUrl\|url" metabase-server/src/utils/config.ts | head -20
```

**Step 2: Update tool-registry.ts**

At the top, add the import:
```typescript
import { SchemaCacheToolHandlers } from "./schema-cache-tools.js";
```

In the `ToolRegistry` class, add the field after existing handlers:
```typescript
private schemaCacheHandlers: SchemaCacheToolHandlers;
```

In the constructor, add after existing instantiations:
```typescript
const metabaseUrl = client["config"].url; // access private config
this.schemaCacheHandlers = new SchemaCacheToolHandlers(client, metabaseUrl);
```

In `getAllToolSchemas()`, add:
```typescript
...this.schemaCacheHandlers.getToolSchemas(),
```

In `handleTool()`, add before the `handleAdditionalTools` fallback:
```typescript
if (this.isSchemaCacheTool(name)) {
  return await this.schemaCacheHandlers.handleTool(name, args);
}
```

Add the private method:
```typescript
private isSchemaCacheTool(name: string): boolean {
  return ["get_schema_cache", "refresh_schema_cache"].includes(name);
}
```

**Step 3: Build**

```bash
cd metabase-server && npm run build 2>&1
```
Expected: clean build, `dist/` updated

**Step 4: Commit**

```bash
git add metabase-server/src/handlers/tool-registry.ts
git commit -m "feat(registry): register schema cache tools in ToolRegistry"
```

---

## Task 5: Expose MetabaseClient config URL (if needed)

The ToolRegistry needs the `METABASE_URL` to pass to `SchemaCacheToolHandlers`. If `client["config"].url` feels too hacky after checking, expose it properly.

**Files:**
- Modify: `metabase-server/src/client/metabase-client.ts`

**Step 1: Add a getter** (add after the constructor):

```typescript
get url(): string {
  return this.config.url;
}
```

**Step 2: Update tool-registry.ts** to use `client.url` instead of `client["config"].url`

**Step 3: Build + Commit**

```bash
cd metabase-server && npm run build 2>&1
git add metabase-server/src/client/metabase-client.ts metabase-server/src/handlers/tool-registry.ts
git commit -m "refactor(client): expose url getter for external use"
```

---

## Task 6: Manual smoke test

**Prerequisite:** A running Metabase instance with `.env` configured (`METABASE_URL`, `METABASE_API_KEY`).

**Step 1: Start the server**

```bash
cd metabase-server && npm run dev
```

**Step 2: Use MCP Inspector to call `refresh_schema_cache`**

```bash
npm run inspector
```

Call `refresh_schema_cache` with no args. Expected response: list of databases with table counts.

**Step 3: Verify cache files exist**

```bash
ls -la ~/.easecloud/metabase-mcp/cache/
cat ~/.easecloud/metabase-mcp/cache/*/database_*.json | head -50
```

Expected: JSON files with `tables` array, each table having `fields` with numeric `id` values.

**Step 4: Call `get_schema_cache`**

Call `get_schema_cache({ database_id: <id> })` a second time. Expected: `cache_status: "fresh"` (served from file, no API call).

**Step 5: Commit any fixes found during smoke test**

---

## Usage Guide for Claude (tool descriptions summary)

Once deployed, Claude should follow this pattern for SQL → interactive question conversion:

```
1. get_card(card_id)
   → note: dataset_query.native.query (SQL) + dataset_query.database (database_id)
   → confirm query_type is "native" before proceeding

2. get_schema_cache(database_id)
   → note: tables[].id, tables[].fields[].id and name
   → build a mental map: column_name → field_id

3. Translate SQL → MBQL
   Example MBQL for "SELECT count(*) FROM orders WHERE status = 'paid'":
   {
     "type": "query",
     "database": <database_id>,
     "query": {
       "source-table": <orders.id>,
       "filter": ["=", ["field", <status.id>, null], "paid"],
       "aggregation": [["count"]]
     }
   }

4. create_card({
     name: "<original name> (Interactive)",
     dataset_query: <mbql from step 3>,
     display: "table",
     visualization_settings: {},
     collection_id: <same as original>   // optional
   })
   → or update_card(card_id, ...) if replace=true
```
