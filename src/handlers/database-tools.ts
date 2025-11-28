/**
 * Database-related tool handlers
 */

import { MetabaseClient } from "../client/metabase-client.js";
import { ErrorCode, McpError } from "../types/errors.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export class DatabaseToolHandlers {
  constructor(private client: MetabaseClient) { }

  getToolSchemas(): Tool[] {
    return [
      {
        name: "list_databases",
        description: "List all databases in Metabase",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "execute_query",
        description: "Execute a SQL query against a Metabase database",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "number",
              description: "ID of the database to query",
            },
            query: { type: "string", description: "SQL query to execute" },
            native_parameters: {
              type: "array",
              description: "Optional parameters for the query",
              items: { type: "object" },
            },
          },
          required: ["database_id", "query"],
        },
      },
      {
        name: "get_database_schema",
        description: "Get the schema information for a database",
        inputSchema: {
          type: "object",
          properties: {
            database_id: { type: "number", description: "ID of the database" },
          },
          required: ["database_id"],
        },
      },
      {
        name: "get_database_tables",
        description: "Get all tables in a database",
        inputSchema: {
          type: "object",
          properties: {
            database_id: { type: "number", description: "ID of the database" },
          },
          required: ["database_id"],
        },
      },
      {
        name: "create_database_connection",
        description: "Create a new database connection",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the database connection",
            },
            engine: {
              type: "string",
              description: "Database engine (e.g., 'postgres', 'mysql', 'h2')",
            },
            details: {
              type: "object",
              description:
                "Connection details (host, port, dbname, user, etc.)",
            },
            auto_run_queries: {
              type: "boolean",
              description: "Whether to auto-run queries",
              default: true,
            },
            is_full_sync: {
              type: "boolean",
              description: "Whether to perform full schema sync",
              default: true,
            },
          },
          required: ["name", "engine", "details"],
        },
      },
      {
        name: "test_database_connection",
        description: "Test a database connection",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "number",
              description: "ID of the database to test",
            },
            connection_details: {
              type: "object",
              description: "Connection details to test (optional)",
            },
          },
        },
      },
      {
        name: "sync_database_schema",
        description: "Sync database schema metadata",
        inputSchema: {
          type: "object",
          properties: {
            database_id: {
              type: "number",
              description: "ID of the database to sync",
            },
          },
          required: ["database_id"],
        },
      },
      {
        name: "get_database_sync_status",
        description: "Get database schema sync status",
        inputSchema: {
          type: "object",
          properties: {
            database_id: { type: "number", description: "ID of the database" },
          },
          required: ["database_id"],
        },
      },
    ];
  }

  async handleTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "list_databases":
        return await this.listDatabases();

      case "execute_query":
        return await this.executeQuery(args);

      case "get_database_schema":
        return await this.getDatabaseSchema(args);

      case "get_database_tables":
        return await this.getDatabaseTables(args);

      case "create_database_connection":
        return await this.createDatabaseConnection(args);

      case "test_database_connection":
        return await this.testDatabaseConnection(args);

      case "sync_database_schema":
        return await this.syncDatabaseSchema(args);

      case "get_database_sync_status":
        return await this.getDatabaseSyncStatus(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown database tool: ${name}`
        );
    }
  }

  private async listDatabases(): Promise<any> {
    const databases = await this.client.getDatabases();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(databases, null, 2),
        },
      ],
    };
  }

  private async executeQuery(args: any): Promise<any> {
    const { database_id, query, native_parameters = [] } = args;

    if (!database_id || !query) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Database ID and query are required"
      );
    }

    const result = await this.client.executeQuery(
      database_id,
      query,
      native_parameters
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getDatabaseSchema(args: any): Promise<any> {
    const { database_id } = args;

    if (!database_id) {
      throw new McpError(ErrorCode.InvalidParams, "Database ID is required");
    }

    const schema = await this.client.apiCall(
      "GET",
      `/api/database/${database_id}/metadata`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(schema, null, 2),
        },
      ],
    };
  }

  private async getDatabaseTables(args: any): Promise<any> {
    const { database_id } = args;

    if (!database_id) {
      throw new McpError(ErrorCode.InvalidParams, "Database ID is required");
    }

    const tables = await this.client.apiCall(
      "GET",
      `/api/table?db_id=${database_id}`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tables, null, 2),
        },
      ],
    };
  }

  private async createDatabaseConnection(args: any): Promise<any> {
    const {
      name,
      engine,
      details,
      auto_run_queries = true,
      is_full_sync = true,
    } = args;

    if (!name || !engine || !details) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "name, engine, and details are required"
      );
    }

    const databaseData = {
      name,
      engine,
      details,
      auto_run_queries,
      is_full_sync,
    };
    const database = await this.client.apiCall(
      "POST",
      "/api/database",
      databaseData
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(database, null, 2),
        },
      ],
    };
  }

  private async testDatabaseConnection(args: any): Promise<any> {
    const { database_id, connection_details } = args;

    if (database_id) {
      const result = await this.client.apiCall(
        "POST",
        `/api/database/${database_id}/test`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } else if (connection_details) {
      const result = await this.client.apiCall(
        "POST",
        "/api/database/test",
        connection_details
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Either database_id or connection_details must be provided"
      );
    }
  }

  private async syncDatabaseSchema(args: any): Promise<any> {
    const { database_id } = args;

    if (!database_id) {
      throw new McpError(ErrorCode.InvalidParams, "Database ID is required");
    }

    const result = await this.client.apiCall(
      "POST",
      `/api/database/${database_id}/sync_schema`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getDatabaseSyncStatus(args: any): Promise<any> {
    const { database_id } = args;

    if (!database_id) {
      throw new McpError(ErrorCode.InvalidParams, "Database ID is required");
    }

    const status = await this.client.apiCall(
      "GET",
      `/api/database/${database_id}/sync_status`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }
}
