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
    const metadata = await this.client.apiCall(
      "GET",
      `/api/database/${databaseId}/metadata`
    );

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
