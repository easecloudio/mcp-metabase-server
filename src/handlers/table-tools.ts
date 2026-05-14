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
      {
        name: "update_tables",
        description: "Bulk-update multiple tables with the same configuration (e.g. hide all at once)",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_ids: {
              type: "array",
              items: { type: "number" },
              description: "List of table IDs to update",
            },
            display_name: { type: "string", description: "New display name for all specified tables" },
            description: { type: "string", description: "Description for all specified tables" },
            visibility_type: {
              type: "string",
              enum: ["normal", "hidden", "technical", "cruft"],
              description: "Visibility type for all specified tables",
            },
          },
          required: ["table_ids"],
        },
      },
      {
        name: "get_table_related",
        description: "Find tables and entities related to this table through foreign key relationships",
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
        name: "get_card_table_fks",
        description: "Get foreign key relationships for a card's virtual table",
        metadata: { mode: ["read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card (question)" },
          },
          required: ["card_id"],
        },
      },
      {
        name: "get_card_table_query_metadata",
        description: "Get query metadata (fields, types) for a card's virtual table",
        metadata: { mode: ["read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card (question)" },
          },
          required: ["card_id"],
        },
      },
      {
        name: "get_table_data",
        description: "Get a sample data preview from a table",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
            limit: {
              type: "number",
              description: "Max rows to return (default: 10)",
              default: 10,
            },
          },
          required: ["table_id"],
        },
      },
      {
        name: "append_csv_to_table",
        description: "Append new rows to a table from CSV content (for Metabase-managed tables)",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
            csv_content: { type: "string", description: "Raw CSV text to append" },
          },
          required: ["table_id", "csv_content"],
        },
      },
      {
        name: "replace_table_csv",
        description: "Replace all data in a table with new CSV content (for Metabase-managed tables)",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
            csv_content: { type: "string", description: "Raw CSV text to replace table data with" },
          },
          required: ["table_id", "csv_content"],
        },
      },
      {
        name: "reorder_table_fields",
        description: "Change the display order of fields in a table",
        metadata: { mode: ["write", "all"], tags: ["table"] },
        inputSchema: {
          type: "object",
          properties: {
            table_id: { type: "number", description: "ID of the table" },
            field_order: {
              type: "array",
              items: { type: "number" },
              description: "Ordered list of field IDs representing the desired display order",
            },
          },
          required: ["table_id", "field_order"],
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
      case "update_tables":              return await this.updateTables(args);
      case "get_table_related":          return await this.getTableRelated(args);
      case "get_card_table_fks":         return await this.getCardTableFks(args);
      case "get_card_table_query_metadata": return await this.getCardTableQueryMetadata(args);
      case "get_table_data":             return await this.getTableData(args);
      case "append_csv_to_table":        return await this.appendCsvToTable(args);
      case "replace_table_csv":          return await this.replaceTableCsv(args);
      case "reorder_table_fields":       return await this.reorderTableFields(args);
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

  private async updateTables(args: any): Promise<any> {
    const { table_ids, display_name, description, visibility_type } = args;
    if (!table_ids || !Array.isArray(table_ids) || table_ids.length === 0) {
      throw new McpError(ErrorCode.InvalidParams, "table_ids is required and must be a non-empty array");
    }
    const updates: Record<string, any> = { ids: table_ids };
    if (display_name !== undefined) updates.display_name = display_name;
    if (description !== undefined) updates.description = description;
    if (visibility_type !== undefined) updates.visibility_type = visibility_type;
    const result = await this.client.apiCall("PUT", `/api/table`, updates);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async getTableRelated(args: any): Promise<any> {
    const { table_id } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    const result = await this.client.apiCall("GET", `/api/table/${table_id}/related`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async getCardTableFks(args: any): Promise<any> {
    const { card_id } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    const result = await this.client.apiCall("GET", `/api/table/card__${card_id}/fks`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async getCardTableQueryMetadata(args: any): Promise<any> {
    const { card_id } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    const result = await this.client.apiCall("GET", `/api/table/card__${card_id}/query_metadata`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async getTableData(args: any): Promise<any> {
    const { table_id, limit = 10 } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    // Fetch table info first to get the database ID
    const tableInfo = await this.client.apiCall("GET", `/api/table/${table_id}`);
    const db_id = tableInfo.db_id;
    const result = await this.client.apiCall("POST", `/api/dataset`, {
      type: "query",
      database: db_id,
      query: { "source-table": table_id, limit },
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async appendCsvToTable(args: any): Promise<any> {
    const { table_id, csv_content } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    if (!csv_content) throw new McpError(ErrorCode.InvalidParams, "csv_content is required");
    const result = await this.client.apiCall("POST", `/api/table/${table_id}/append`, { csv: csv_content });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async replaceTableCsv(args: any): Promise<any> {
    const { table_id, csv_content } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    if (!csv_content) throw new McpError(ErrorCode.InvalidParams, "csv_content is required");
    const result = await this.client.apiCall("POST", `/api/table/${table_id}/replace`, { csv: csv_content });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async reorderTableFields(args: any): Promise<any> {
    const { table_id, field_order } = args;
    if (!table_id) throw new McpError(ErrorCode.InvalidParams, "table_id is required");
    if (!field_order || !Array.isArray(field_order) || field_order.length === 0) {
      throw new McpError(ErrorCode.InvalidParams, "field_order is required and must be a non-empty array");
    }
    const result = await this.client.apiCall("PUT", `/api/table/${table_id}/fields/order`, field_order);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
}
