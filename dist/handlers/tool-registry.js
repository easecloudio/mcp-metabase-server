/**
 * Tool registry that manages all tool handlers
 */
import { DashboardToolHandlers } from "./dashboard-tools.js";
import { CardToolHandlers } from "./card-tools.js";
import { DatabaseToolHandlers } from "./database-tools.js";
import { ErrorCode, McpError } from "../types/errors.js";
export class ToolRegistry {
    client;
    dashboardHandlers;
    cardHandlers;
    databaseHandlers;
    constructor(client) {
        this.client = client;
        this.dashboardHandlers = new DashboardToolHandlers(client);
        this.cardHandlers = new CardToolHandlers(client);
        this.databaseHandlers = new DatabaseToolHandlers(client);
    }
    /**
     * Get all available tool schemas
     */
    getAllToolSchemas() {
        return [
            ...this.dashboardHandlers.getToolSchemas(),
            ...this.cardHandlers.getToolSchemas(),
            ...this.databaseHandlers.getToolSchemas(),
            // Add other tool schemas for collections, users, etc.
            ...this.getAdditionalToolSchemas(),
        ];
    }
    /**
     * Handle a tool call
     */
    async handleTool(name, args) {
        // Dashboard tools
        if (this.isDashboardTool(name)) {
            return await this.dashboardHandlers.handleTool(name, args);
        }
        // Card tools
        if (this.isCardTool(name)) {
            return await this.cardHandlers.handleTool(name, args);
        }
        // Database tools
        if (this.isDatabaseTool(name)) {
            return await this.databaseHandlers.handleTool(name, args);
        }
        // Handle other tools directly
        return await this.handleAdditionalTools(name, args);
    }
    isDashboardTool(name) {
        return (name.startsWith("dashboard") ||
            [
                "list_dashboards",
                "create_dashboard",
                "update_dashboard",
                "delete_dashboard",
                "get_dashboard_cards",
                "add_card_to_dashboard",
                "remove_card_from_dashboard",
                "update_dashboard_card",
            ].includes(name));
    }
    isCardTool(name) {
        return (name.startsWith("card") ||
            [
                "list_cards",
                "get_card",
                "create_card",
                "update_card",
                "delete_card",
                "execute_card",
            ].includes(name));
    }
    isDatabaseTool(name) {
        return (name.startsWith("database") ||
            name.includes("query") ||
            [
                "list_databases",
                "execute_query",
                "get_database_schema",
                "get_database_tables",
            ].includes(name));
    }
    getAdditionalToolSchemas() {
        return [
            // Collection tools
            {
                name: "list_collections",
                description: "List all collections in Metabase",
                inputSchema: {
                    type: "object",
                    properties: {
                        archived: {
                            type: "boolean",
                            description: "Include archived collections",
                            default: false,
                        },
                    },
                },
            },
            {
                name: "create_collection",
                description: "Create a new Metabase collection",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Name of the collection" },
                        description: {
                            type: "string",
                            description: "Description of the collection",
                        },
                        color: { type: "string", description: "Color of the collection" },
                        parent_id: {
                            type: "number",
                            description: "Parent collection ID (null for root level)",
                        },
                    },
                    required: ["name"],
                },
            },
            // User tools
            {
                name: "list_users",
                description: "List all users in Metabase",
                inputSchema: {
                    type: "object",
                    properties: {
                        include_deactivated: {
                            type: "boolean",
                            description: "Include deactivated users",
                            default: false,
                        },
                    },
                },
            },
            {
                name: "create_user",
                description: "Create a new Metabase user",
                inputSchema: {
                    type: "object",
                    properties: {
                        first_name: { type: "string", description: "User's first name" },
                        last_name: { type: "string", description: "User's last name" },
                        email: { type: "string", description: "User's email address" },
                        password: { type: "string", description: "User's password" },
                        group_ids: {
                            type: "array",
                            description: "Array of group IDs to assign user to",
                            items: { type: "number" },
                        },
                    },
                    required: ["first_name", "last_name", "email"],
                },
            },
            // Permission tools
            {
                name: "list_permission_groups",
                description: "List all permission groups",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "create_permission_group",
                description: "Create a new permission group",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "Name of the permission group",
                        },
                    },
                    required: ["name"],
                },
            },
            // Search tools
            {
                name: "search_content",
                description: "Search across all Metabase content",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search query" },
                        models: {
                            type: "array",
                            description: "Filter by content types",
                            items: {
                                type: "string",
                                enum: ["card", "dashboard", "collection", "database", "table"],
                            },
                        },
                    },
                    required: ["query"],
                },
            },
        ];
    }
    async handleAdditionalTools(name, args) {
        switch (name) {
            // Collection operations
            case "list_collections":
                return await this.handleListCollections(args);
            case "create_collection":
                return await this.handleCreateCollection(args);
            // User operations
            case "list_users":
                return await this.handleListUsers(args);
            case "create_user":
                return await this.handleCreateUser(args);
            // Permission operations
            case "list_permission_groups":
                return await this.handleListPermissionGroups();
            case "create_permission_group":
                return await this.handleCreatePermissionGroup(args);
            // Search operations
            case "search_content":
                return await this.handleSearchContent(args);
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    async handleListCollections(args) {
        const { archived = false } = args;
        const collections = await this.client.getCollections(archived);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(collections, null, 2),
                },
            ],
        };
    }
    async handleCreateCollection(args) {
        const { name, description, color, parent_id } = args;
        if (!name) {
            throw new McpError(ErrorCode.InvalidParams, "Collection name is required");
        }
        const collectionData = { name };
        if (description !== undefined)
            collectionData.description = description;
        if (color !== undefined)
            collectionData.color = color;
        if (parent_id !== undefined)
            collectionData.parent_id = parent_id;
        const collection = await this.client.createCollection(collectionData);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(collection, null, 2),
                },
            ],
        };
    }
    async handleListUsers(args) {
        const { include_deactivated = false } = args;
        const users = await this.client.getUsers(include_deactivated);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(users, null, 2),
                },
            ],
        };
    }
    async handleCreateUser(args) {
        const { first_name, last_name, email, password, group_ids } = args;
        if (!first_name || !last_name || !email) {
            throw new McpError(ErrorCode.InvalidParams, "first_name, last_name, and email are required");
        }
        const userData = { first_name, last_name, email };
        if (password !== undefined)
            userData.password = password;
        if (group_ids !== undefined)
            userData.group_ids = group_ids;
        const user = await this.client.createUser(userData);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(user, null, 2),
                },
            ],
        };
    }
    async handleListPermissionGroups() {
        const groups = await this.client.getPermissionGroups();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(groups, null, 2),
                },
            ],
        };
    }
    async handleCreatePermissionGroup(args) {
        const { name } = args;
        if (!name) {
            throw new McpError(ErrorCode.InvalidParams, "Group name is required");
        }
        const group = await this.client.createPermissionGroup(name);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(group, null, 2),
                },
            ],
        };
    }
    async handleSearchContent(args) {
        const { query, models } = args;
        if (!query) {
            throw new McpError(ErrorCode.InvalidParams, "Search query is required");
        }
        const params = { q: query };
        if (models && Array.isArray(models) && models.length > 0) {
            params.models = models.join(",");
        }
        const results = await this.client.apiCall("GET", "/api/search", params);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }
}
