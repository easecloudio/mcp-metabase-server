/**
 * Card/Question-related tool handlers
 */
import { ErrorCode, McpError } from "../types/errors.js";
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
];
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
];
export class CardToolHandlers {
    client;
    constructor(client) {
        this.client = client;
    }
    getToolSchemas() {
        return [
            {
                name: "list_cards",
                description: "List all questions/cards in Metabase",
                inputSchema: {
                    type: "object",
                    properties: {
                        attributes: {
                            type: "array",
                            description: `Optional list of attributes to return for each card. If omitted, returns default attributes: ${DEFAULT_CARD_ATTRIBUTES.join(", ")}. Excludes heavy fields like result_metadata, visualization_settings, dataset_query, creator, collection, and last-edit-info by default.`,
                            items: {
                                type: "string",
                                enum: ALL_CARD_ATTRIBUTES,
                            },
                        },
                    },
                },
            },
            {
                name: "get_card",
                description: "Get a single Metabase question/card by ID with full details including the SQL query (dataset_query). Returns MBQL 5 by default.",
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
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Name of the card" },
                        dataset_query: {
                            type: "object",
                            description: "The query for the card (e.g., MBQL or native query)",
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
                inputSchema: {
                    type: "object",
                    properties: {
                        card_id: {
                            type: "number",
                            description: "ID of the card to delete",
                        },
                        hard_delete: {
                            type: "boolean",
                            description: "Set to true for hard delete, false (default) for archive",
                            default: false,
                        },
                    },
                    required: ["card_id"],
                },
            },
            {
                name: "execute_card",
                description: "Execute a Metabase question/card and get results",
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
        ];
    }
    async handleTool(name, args) {
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
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown card tool: ${name}`);
        }
    }
    async listCards(args) {
        const cards = await this.client.getCards();
        const attributes = args?.attributes || DEFAULT_CARD_ATTRIBUTES;
        // Project only requested attributes
        const filteredCards = cards.map((card) => {
            const filtered = {};
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
    async getCard(args) {
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
    async createCard(args) {
        const { name, dataset_query, display, visualization_settings, collection_id, description, } = args;
        if (!name || !dataset_query || !display || !visualization_settings) {
            throw new McpError(ErrorCode.InvalidParams, "Missing required fields: name, dataset_query, display, visualization_settings");
        }
        const cardData = {
            name,
            dataset_query,
            display,
            visualization_settings,
        };
        if (collection_id !== undefined)
            cardData.collection_id = collection_id;
        if (description !== undefined)
            cardData.description = description;
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
    async updateCard(args) {
        const { card_id, ...updateFields } = args;
        if (!card_id) {
            throw new McpError(ErrorCode.InvalidParams, "Card ID is required");
        }
        if (Object.keys(updateFields).length === 0) {
            throw new McpError(ErrorCode.InvalidParams, "No fields provided for update");
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
    async deleteCard(args) {
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
    async executeCard(args) {
        const { card_id, parameters = {} } = args;
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
}
