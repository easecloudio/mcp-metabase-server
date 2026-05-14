// src/handlers/table-tools.ts
import { MetabaseClient } from "../client/metabase-client.js";
import { ErrorCode, McpError } from "../types/errors.js";
import { TaggedTool } from "../types/tool-metadata.js";

export class TableToolHandlers {
  constructor(private client: MetabaseClient) {}

  getToolSchemas(): TaggedTool[] {
    return [
      {
        name: "list_tables",
        description: "List all tables across all databases in Metabase",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "number",
              description: "Optional: filter tables by database ID",
            },
          },
        },
      },
      {
        name: "get_table",
        description: "Get metadata for a specific table by ID",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
          },
          required: ["table_id"],
        },
      },
      {
        name: "get_table_metadata",
        description: "Get full query metadata for a table including all fields with their IDs, types, and semantic types. Use this to get field IDs needed for MBQL queries.",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
            include_sensitive_fields: {
              type: "boolean",
              description: "Include sensitive fields (default: false)",
              default: false,
            },
          },
          required: ["table_id"],
        },
      },
      {
        name: "get_table_fks",
        description: "Get all foreign key relationships for a table",
        metadata: { mode: ["read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
          },
          required: ["table_id"],
        },
      },
      {
        name: "get_field_id",
        description: "Look up the Metabase field ID for a column by table ID and column name. Essential for building MBQL queries.",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
            field_name: { type: "string", description: "Column name to look up (case-insensitive)" },
          },
          required: ["table_id", "field_name"],
        },
      },
      {
        name: "update_table",
        description: "Update table metadata (display name, description, visibility)",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
            display_name: { type: "string", description: "New display name" },
            description: { type: "string", description: "Table description" },
            visibility_type: {
              type: "string",
              enum: ["normal", "hidden", "technical", "cruft"],
              description: "Table visibility in the UI",
            },
          },
          required: ["table_id"],
        },
      },
      {
        name: "sync_table_schema",
        description: "Trigger a schema sync for a specific table",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
          },
          required: ["table_id"],
        },
      },
      {
        name: "rescan_table_field_values",
        description: "Rescan field values for a table (updates filter dropdowns)",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
          },
          required: ["table_id"],
        },
      },
      {
        name: "discard_table_field_values",
        description: "Discard cached field values for a table",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
          },
          required: ["table_id"],
        },
      },
    ];
  }

  async handleTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "list_tables":       return await this.listTables(args);
      case "get_table":         return await this.getTable(args);
      case "get_table_metadata": return await this.getTableMetadata(args);
      case "get_table_fks":     return await this.getTableFks(args);
      case "get_field_id":      return await this.getFieldId(args);
      case "update_table":      return await this.updateTable(args);
      case "sync_table_schema": return await this.syncTableSchema(args);
      case "rescan_table_field_values": return await this.rescanTableFieldValues(args);
      case "discard_table_field_values": return await this.discardTableFieldValues(args);
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown table tool: ${name}`);
    }
  }

  private async listTables(args: any): Promise<any> {
    const { database_id } = args ?? {};
    const endpoint = database_id
      ? `/api/database/${database_id}/tables`
      : `/api/table`;
    const tables = await this.client.apiCall("GET", endpoint);
    return { content: [{ type: "text", text: JSON.stringify(tables, null, 2) }] };
  }

  private async getTable(args: any): Promise<any> {
    const { table_id } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    const table = await this.client.apiCall("GET", `/api/table/${table_id}`);
    return { content: [{ type: "text", text: JSON.stringify(table, null, 2) }] };
  }

  private async getTableMetadata(args: any): Promise<any> {
    const { table_id, include_sensitive_fields = false } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    const metadata = await this.client.apiCall(
      "GET",
      `/api/table/${table_id}/query_metadata`,
      { include_sensitive_fields }
    );
    return { content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }] };
  }

  private async getTableFks(args: any): Promise<any> {
    const { table_id } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    const fks = await this.client.apiCall("GET", `/api/table/${table_id}/fks`);
    return { content: [{ type: "text", text: JSON.stringify(fks, null, 2) }] };
  }

  private async getFieldId(args: any): Promise<any> {
    const { table_id, field_name } = args;
    if (!table_id || !field_name) {
      throw new McpError(ErrorCode.InvalidParams, "table_id and field_name are required");
    }
    const metadata = await this.client.apiCall(
      "GET",
      `/api/table/${table_id}/query_metadata`
    );
    const field = (metadata.fields ?? []).find(
      (f: any) => f.name?.toLowerCase() === field_name.toLowerCase()
    );
    if (!field) {
      const available = (metadata.fields ?? []).map((f: any) => f.name).join(", ");
      throw new McpError(
        ErrorCode.InvalidParams,
        `Field "${field_name}" not found in table ${table_id}. Available: ${available}`
      );
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          field_id: field.id,
          name: field.name,
          display_name: field.display_name,
          base_type: field.base_type,
          semantic_type: field.semantic_type,
          mbql_ref: ["field", field.id, null],
        }, null, 2),
      }],
    };
  }

  private async updateTable(args: any): Promise<any> {
    const { table_id, ...updates } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    const result = await this.client.apiCall("PUT", `/api/table/${table_id}`, updates);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async syncTableSchema(args: any): Promise<any> {
    const { table_id } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    await this.client.apiCall("POST", `/api/table/${table_id}/sync`);
    return { content: [{ type: "text", text: `Table ${table_id} schema sync triggered.` }] };
  }

  private async rescanTableFieldValues(args: any): Promise<any> {
    const { table_id } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    await this.client.apiCall("POST", `/api/table/${table_id}/rescan_values`);
    return { content: [{ type: "text", text: `Table ${table_id} field values rescan triggered.` }] };
  }

  private async discardTableFieldValues(args: any): Promise<any> {
    const { table_id } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    await this.client.apiCall("POST", `/api/table/${table_id}/discard_values`);
    return { content: [{ type: "text", text: `Table ${table_id} field values discarded.` }] };
  }
}
