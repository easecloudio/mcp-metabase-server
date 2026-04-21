/**
 * Card/Question-related tool handlers
 */

import { MetabaseClient } from "../client/metabase-client.js";
import { ErrorCode, McpError } from "../types/errors.js";
import { TaggedTool } from "../types/tool-metadata.js";

// Default attributes to return when listing cards (excludes heavy fields like result_metadata)
const DEFAULT_CARD_ATTRIBUTES = [
  "id",
  "name",
  "description",
  "collection_id",
  "display",
  "type",
  "query_type",
  "database_id",
  "archived",
  "created_at",
  "updated_at",
] as const;

// All available card attributes
const ALL_CARD_ATTRIBUTES = [
  "id",
  "name",
  "description",
  "collection_id",
  "collection",
  "archived",
  "archived_directly",
  "dataset_query",
  "display",
  "visualization_settings",
  "type",
  "query_type",
  "database_id",
  "table_id",
  "creator_id",
  "creator",
  "created_at",
  "updated_at",
  "last_used_at",
  "view_count",
  "cache_invalidated_at",
  "cache_ttl",
  "collection_position",
  "source_card_id",
  "result_metadata",
  "initially_published_at",
  "card_schema",
  "enable_embedding",
  "made_public_by_id",
  "embedding_params",
  "entity_id",
  "collection_preview",
  "last-edit-info",
  "metabase_version",
  "parameters",
  "parameter_mappings",
  "dashboard_id",
  "public_uuid",
] as const;

export class CardToolHandlers {
  constructor(private client: MetabaseClient) {}

  getToolSchemas(): TaggedTool[] {
    return [
      {
        name: "list_cards",
        description: "List all questions/cards in Metabase",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            attributes: {
              type: "array",
              description: `Optional list of attributes to return for each card. If omitted, returns default attributes: ${DEFAULT_CARD_ATTRIBUTES.join(", ")}. Excludes heavy fields like result_metadata, visualization_settings, dataset_query, creator, collection, and last-edit-info by default.`,
              items: {
                type: "string",
                enum: ALL_CARD_ATTRIBUTES as unknown as string[],
              },
            },
          },
        },
      },
      {
        name: "get_card",
        description: "Get a single Metabase question/card by ID with full details including the SQL query (dataset_query). Returns MBQL 5 by default.",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: {
              type: "number",
              description: "ID of the card to retrieve",
            },
          },
          required: ["card_id"],
        },
      },
      {
        name: "create_card",
        description: "Create a new Metabase question (card)",
        metadata: { mode: ["write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the card" },
            dataset_query: {
              type: "object",
              description:
                "The query for the card (e.g., MBQL or native query)",
            },
            display: {
              type: "string",
              description: "Display type (e.g., 'table', 'line', 'bar')",
            },
            visualization_settings: {
              type: "object",
              description: "Settings for the visualization",
            },
            collection_id: {
              type: "number",
              description: "Optional ID of the collection to save the card in",
            },
            description: {
              type: "string",
              description: "Optional description for the card",
            },
          },
          required: [
            "name",
            "dataset_query",
            "display",
            "visualization_settings",
          ],
        },
      },
      {
        name: "update_card",
        description: "Update an existing Metabase question (card)",
        metadata: { mode: ["write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: {
              type: "number",
              description: "ID of the card to update",
            },
            name: { type: "string", description: "New name for the card" },
            dataset_query: {
              type: "object",
              description: "New query for the card",
            },
            display: { type: "string", description: "New display type" },
            visualization_settings: {
              type: "object",
              description: "New visualization settings",
            },
            collection_id: { type: "number", description: "New collection ID" },
            description: { type: "string", description: "New description" },
            archived: {
              type: "boolean",
              description: "Set to true to archive the card",
            },
          },
          required: ["card_id"],
        },
      },
      {
        name: "delete_card",
        description: "Delete a Metabase question (card)",
        metadata: { mode: ["write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: {
              type: "number",
              description: "ID of the card to delete",
            },
            hard_delete: {
              type: "boolean",
              description:
                "Set to true for hard delete, false (default) for archive",
              default: false,
            },
          },
          required: ["card_id"],
        },
      },
      {
        name: "execute_card",
        description: "Execute a Metabase question/card and get results",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: {
              type: "number",
              description: "ID of the card/question to execute",
            },
            parameters: {
              type: "object",
              description: "Optional parameters for the query",
            },
          },
          required: ["card_id"],
        },
      },
      {
        name: "create_card_public_link",
        description: "Create a public sharing link for a card/question. Returns the UUID for the public URL.",
        metadata: { mode: ["write", "all"], tags: ["card", "sharing"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card to share" },
          },
          required: ["card_id"],
        },
      },
      {
        name: "delete_card_public_link",
        description: "Remove the public sharing link for a card/question",
        metadata: { mode: ["write", "all"], tags: ["card", "sharing"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card" },
          },
          required: ["card_id"],
        },
      },
      {
        name: "list_public_cards",
        description: "List all cards that have public sharing links enabled",
        metadata: { mode: ["read", "write", "all"], tags: ["card", "sharing"] },
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_embeddable_cards",
        description: "List all cards that are set up for embedding",
        metadata: { mode: ["read", "write", "all"], tags: ["card", "sharing"] },
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "export_card_result",
        description: "Export a card's query results in the specified format (csv, json, xlsx)",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card to export" },
            format: {
              type: "string",
              enum: ["csv", "json", "xlsx"],
              description: "Export format",
              default: "json",
            },
            parameters: {
              type: "array",
              description: "Optional query parameters",
              items: { type: "object" },
            },
          },
          required: ["card_id"],
        },
      },
      {
        name: "copy_card",
        description: "Duplicate an existing card/question",
        metadata: { mode: ["write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card to copy" },
            name: { type: "string", description: "Name for the copy (defaults to 'Copy of <original>')" },
            collection_id: { type: "number", description: "Collection to place the copy in" },
          },
          required: ["card_id"],
        },
      },
      {
        name: "get_card_query_metadata",
        description: "Get query metadata for a card including column types and display names",
        metadata: { mode: ["read", "write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card" },
          },
          required: ["card_id"],
        },
      },
      {
        name: "get_card_dashboards",
        description: "List all dashboards that contain a specific card",
        metadata: { mode: ["read", "write", "all"], tags: ["card"] },
        inputSchema: {
          type: "object",
          properties: {
            card_id: { type: "number", description: "ID of the card" },
          },
          required: ["card_id"],
        },
      },
    ];
  }

  async handleTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "list_cards":
        return await this.listCards(args);

      case "get_card":
        return await this.getCard(args);

      case "create_card":
        return await this.createCard(args);

      case "update_card":
        return await this.updateCard(args);

      case "delete_card":
        return await this.deleteCard(args);

      case "execute_card":
        return await this.executeCard(args);

      case "create_card_public_link":
        return await this.createPublicLink(args);
      case "delete_card_public_link":
        return await this.deletePublicLink(args);
      case "list_public_cards":
        return await this.listPublicCards();
      case "list_embeddable_cards":
        return await this.listEmbeddableCards();
      case "export_card_result":
        return await this.exportCardResult(args);
      case "copy_card":
        return await this.copyCard(args);
      case "get_card_query_metadata":
        return await this.getCardQueryMetadata(args);
      case "get_card_dashboards":
        return await this.getCardDashboards(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown card tool: ${name}`
        );
    }
  }

  private async listCards(args?: any): Promise<any> {
    const cards = await this.client.getCards();
    const attributes = args?.attributes || DEFAULT_CARD_ATTRIBUTES;

    // Project only requested attributes
    const filteredCards = cards.map((card: any) => {
      const filtered: any = {};
      for (const attr of attributes) {
        if (attr in card) {
          filtered[attr] = card[attr];
        }
      }
      return filtered;
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(filteredCards, null, 2),
        },
      ],
    };
  }

  private async getCard(args: any): Promise<any> {
    const { card_id } = args;

    if (!card_id) {
      throw new McpError(ErrorCode.InvalidParams, "Card ID is required");
    }

    const card = await this.client.getCard(card_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(card, null, 2),
        },
      ],
    };
  }

  private async createCard(args: any): Promise<any> {
    const {
      name,
      dataset_query,
      display,
      visualization_settings,
      collection_id,
      description,
    } = args;

    if (!name || !dataset_query || !display || !visualization_settings) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Missing required fields: name, dataset_query, display, visualization_settings"
      );
    }

    const cardData: any = {
      name,
      dataset_query,
      display,
      visualization_settings,
    };
    if (collection_id !== undefined) cardData.collection_id = collection_id;
    if (description !== undefined) cardData.description = description;

    const card = await this.client.createCard(cardData);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(card, null, 2),
        },
      ],
    };
  }

  private async updateCard(args: any): Promise<any> {
    const { card_id, ...updateFields } = args;

    if (!card_id) {
      throw new McpError(ErrorCode.InvalidParams, "Card ID is required");
    }

    if (Object.keys(updateFields).length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "No fields provided for update"
      );
    }

    const card = await this.client.updateCard(card_id, updateFields);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(card, null, 2),
        },
      ],
    };
  }

  private async deleteCard(args: any): Promise<any> {
    const { card_id, hard_delete = false } = args;

    if (!card_id) {
      throw new McpError(ErrorCode.InvalidParams, "Card ID is required");
    }

    await this.client.deleteCard(card_id, hard_delete);

    return {
      content: [
        {
          type: "text",
          text: hard_delete
            ? `Card ${card_id} permanently deleted.`
            : `Card ${card_id} archived.`,
        },
      ],
    };
  }

  private async executeCard(args: any): Promise<any> {
    const { card_id, parameters = [] } = args;

    if (!card_id) {
      throw new McpError(ErrorCode.InvalidParams, "Card ID is required");
    }

    const result = await this.client.executeCard(card_id, parameters);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async createPublicLink(args: any): Promise<any> {
    const { card_id } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    const result = await this.client.apiCall("POST", `/api/card/${card_id}/public_link`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async deletePublicLink(args: any): Promise<any> {
    const { card_id } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    await this.client.apiCall("DELETE", `/api/card/${card_id}/public_link`);
    return { content: [{ type: "text", text: `Public link for card ${card_id} removed.` }] };
  }

  private async listPublicCards(): Promise<any> {
    const cards = await this.client.apiCall("GET", `/api/card/public`);
    return { content: [{ type: "text", text: JSON.stringify(cards, null, 2) }] };
  }

  private async listEmbeddableCards(): Promise<any> {
    const cards = await this.client.apiCall("GET", `/api/card/embeddable`);
    return { content: [{ type: "text", text: JSON.stringify(cards, null, 2) }] };
  }

  private async exportCardResult(args: any): Promise<any> {
    const { card_id, format = "json", parameters = [] } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    const result = await this.client.apiCall(
      "POST",
      `/api/card/${card_id}/query/${format}`,
      { parameters }
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async copyCard(args: any): Promise<any> {
    const { card_id, name, collection_id } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    const body: any = {};
    if (name) body.name = name;
    if (collection_id !== undefined) body.collection_id = collection_id;
    const result = await this.client.apiCall("POST", `/api/card/${card_id}/copy`, body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async getCardQueryMetadata(args: any): Promise<any> {
    const { card_id } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    const result = await this.client.apiCall("GET", `/api/card/${card_id}/query_metadata`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  private async getCardDashboards(args: any): Promise<any> {
    const { card_id } = args;
    if (!card_id) throw new McpError(ErrorCode.InvalidParams, "card_id is required");
    const result = await this.client.apiCall("GET", `/api/card/${card_id}/dashboards`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
}
