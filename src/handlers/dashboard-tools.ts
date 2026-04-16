/**
 * Dashboard-related tool handlers
 */

import { MetabaseClient } from "../client/metabase-client.js";
import { ErrorCode, McpError } from "../types/errors.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export class DashboardToolHandlers {
  constructor(private client: MetabaseClient) {}

  getToolSchemas(): Tool[] {
    return [
      {
        name: "list_dashboards",
        description: "List all dashboards in Metabase",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_dashboard",
        description: "Create a new Metabase dashboard",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name of the dashboard" },
            description: {
              type: "string",
              description: "Optional description for the dashboard",
            },
            parameters: {
              type: "array",
              description: "Optional parameters for the dashboard",
              items: { type: "object" },
            },
            collection_id: {
              type: "number",
              description:
                "Optional ID of the collection to save the dashboard in",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "update_dashboard",
        description: "Update an existing Metabase dashboard",
        inputSchema: {
          type: "object",
          properties: {
            dashboard_id: {
              type: "number",
              description: "ID of the dashboard to update",
            },
            name: { type: "string", description: "New name for the dashboard" },
            description: {
              type: "string",
              description: "New description for the dashboard",
            },
            parameters: {
              type: "array",
              description: "New parameters for the dashboard",
              items: { type: "object" },
            },
            collection_id: { type: "number", description: "New collection ID" },
            archived: {
              type: "boolean",
              description: "Set to true to archive the dashboard",
            },
          },
          required: ["dashboard_id"],
        },
      },
      {
        name: "delete_dashboard",
        description: "Delete a Metabase dashboard",
        inputSchema: {
          type: "object",
          properties: {
            dashboard_id: {
              type: "number",
              description: "ID of the dashboard to delete",
            },
            hard_delete: {
              type: "boolean",
              description:
                "Set to true for hard delete, false (default) for archive",
              default: false,
            },
          },
          required: ["dashboard_id"],
        },
      },
      {
        name: "get_dashboard_cards",
        description: "Get all cards in a dashboard",
        inputSchema: {
          type: "object",
          properties: {
            dashboard_id: {
              type: "number",
              description: "ID of the dashboard",
            },
          },
          required: ["dashboard_id"],
        },
      },
      {
        name: "add_card_to_dashboard",
        description: "Add a card to a dashboard with positioning",
        inputSchema: {
          type: "object",
          properties: {
            dashboard_id: {
              type: "number",
              description: "ID of the dashboard",
            },
            card_id: {
              type: "number",
              description: "ID of the card to add",
            },
            row: {
              type: "number",
              description: "Row position (0-based)",
              default: 0,
            },
            col: {
              type: "number",
              description: "Column position (0-based)",
              default: 0,
            },
            size_x: {
              type: "number",
              description: "Width in grid units",
              default: 4,
            },
            size_y: {
              type: "number",
              description: "Height in grid units",
              default: 4,
            },
            parameter_mappings: {
              type: "array",
              description: "Parameter mappings between dashboard and card",
              items: { type: "object" },
            },
            visualization_settings: {
              type: "object",
              description: "Visualization settings for the card on this dashboard",
            },
          },
          required: ["dashboard_id", "card_id"],
        },
      },
      {
        name: "remove_card_from_dashboard",
        description: "Remove a card from a dashboard",
        inputSchema: {
          type: "object",
          properties: {
            dashboard_id: {
              type: "number",
              description: "ID of the dashboard",
            },
            dashcard_id: {
              type: "number",
              description: "ID of the dashboard card (not the card itself)",
            },
          },
          required: ["dashboard_id", "dashcard_id"],
        },
      },
      {
        name: "update_dashboard_card",
        description: "Update card position, size, and settings on a dashboard",
        inputSchema: {
          type: "object",
          properties: {
            dashboard_id: {
              type: "number",
              description: "ID of the dashboard",
            },
            dashcard_id: {
              type: "number",
              description: "ID of the dashboard card",
            },
            row: {
              type: "number",
              description: "New row position",
            },
            col: {
              type: "number",
              description: "New column position",
            },
            size_x: {
              type: "number",
              description: "New width in grid units",
            },
            size_y: {
              type: "number",
              description: "New height in grid units",
            },
            parameter_mappings: {
              type: "array",
              description: "Updated parameter mappings",
              items: { type: "object" },
            },
            visualization_settings: {
              type: "object",
              description: "Updated visualization settings",
            },
          },
          required: ["dashboard_id", "dashcard_id"],
        },
      },
    ];
  }

  async handleTool(name: string, args: any): Promise<any> {
    switch (name) {
      case "list_dashboards":
        return await this.listDashboards();

      case "create_dashboard":
        return await this.createDashboard(args);

      case "update_dashboard":
        return await this.updateDashboard(args);

      case "delete_dashboard":
        return await this.deleteDashboard(args);

      case "get_dashboard_cards":
        return await this.getDashboardCards(args);

      case "add_card_to_dashboard":
        return await this.addCardToDashboard(args);

      case "remove_card_from_dashboard":
        return await this.removeCardFromDashboard(args);

      case "update_dashboard_card":
        return await this.updateDashboardCard(args);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown dashboard tool: ${name}`
        );
    }
  }

  private async listDashboards(): Promise<any> {
    const dashboards = await this.client.getDashboards();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(dashboards, null, 2),
        },
      ],
    };
  }

  private async createDashboard(args: any): Promise<any> {
    const { name, description, parameters, collection_id } = args;

    if (!name) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Missing required field: name"
      );
    }

    const dashboardData: any = { name };
    if (description !== undefined) dashboardData.description = description;
    if (parameters !== undefined) dashboardData.parameters = parameters;
    if (collection_id !== undefined)
      dashboardData.collection_id = collection_id;

    const dashboard = await this.client.createDashboard(dashboardData);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(dashboard, null, 2),
        },
      ],
    };
  }

  private async updateDashboard(args: any): Promise<any> {
    const { dashboard_id, ...updateFields } = args;

    if (!dashboard_id) {
      throw new McpError(ErrorCode.InvalidParams, "Dashboard ID is required");
    }

    if (Object.keys(updateFields).length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "No fields provided for update"
      );
    }

    const dashboard = await this.client.updateDashboard(
      dashboard_id,
      updateFields
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(dashboard, null, 2),
        },
      ],
    };
  }

  private async deleteDashboard(args: any): Promise<any> {
    const { dashboard_id, hard_delete = false } = args;

    if (!dashboard_id) {
      throw new McpError(ErrorCode.InvalidParams, "Dashboard ID is required");
    }

    await this.client.deleteDashboard(dashboard_id, hard_delete);

    return {
      content: [
        {
          type: "text",
          text: hard_delete
            ? `Dashboard ${dashboard_id} permanently deleted.`
            : `Dashboard ${dashboard_id} archived.`,
        },
      ],
    };
  }

  private async getDashboardCards(args: any): Promise<any> {
    const { dashboard_id } = args;

    if (!dashboard_id) {
      throw new McpError(ErrorCode.InvalidParams, "Dashboard ID is required");
    }

    const dashboard = await this.client.getDashboard(dashboard_id);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(dashboard.dashcards || [], null, 2),
        },
      ],
    };
  }

  private async addCardToDashboard(args: any): Promise<any> {
    const {
      dashboard_id,
      card_id,
      row = 0,
      col = 0,
      size_x = 4,
      size_y = 4,
      parameter_mappings = [],
      visualization_settings = {},
    } = args;

    if (!dashboard_id || !card_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Dashboard ID and Card ID are required"
      );
    }

    // Try different API approaches based on Metabase version
    let result;
    
    try {
      // Approach 1: Direct POST to dashboard cards (works in some versions)
      const dashcardData = {
        cardId: card_id,
        row,
        col,
        sizeX: size_x,
        sizeY: size_y,
        parameter_mappings,
        visualization_settings,
      };

      result = await this.client.apiCall(
        "POST",
        `/api/dashboard/${dashboard_id}/cards`,
        dashcardData
      );
    } catch (error) {
      // Approach 2: Use PUT to update entire dashboard cards array
      try {
        const dashboard = await this.client.getDashboard(dashboard_id);
        
        // Create new card object for the dashboard
        const newCard = {
          id: -1, // Temporary ID for new cards
          card_id,
          row,
          col,
          size_x,
          size_y,
          parameter_mappings,
          visualization_settings,
        };

        // Add the new card to existing cards
        const updatedCards = [...(dashboard.dashcards || []), newCard];

        result = await this.client.apiCall(
          "PUT",
          `/api/dashboard/${dashboard_id}/cards`,
          { dashcards: updatedCards, tabs: dashboard.tabs || [] }
        );
      } catch (putError) {
        // Approach 3: Try alternative endpoint structure
        const alternativeData = {
          card_id,
          row,
          col,
          size_x,
          size_y,
          parameter_mappings,
          visualization_settings,
        };

        result = await this.client.apiCall(
          "POST",
          `/api/dashboard/${dashboard_id}/dashcard`,
          alternativeData
        );
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async removeCardFromDashboard(args: any): Promise<any> {
    const { dashboard_id, dashcard_id } = args;

    if (!dashboard_id || !dashcard_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Dashboard ID and Dashcard ID are required"
      );
    }

    try {
      // Approach 1: Direct DELETE (standard approach)
      await this.client.apiCall(
        "DELETE",
        `/api/dashboard/${dashboard_id}/cards/${dashcard_id}`
      );
    } catch (error) {
      // Approach 2: Try alternative endpoint
      try {
        await this.client.apiCall(
          "DELETE",
          `/api/dashboard/${dashboard_id}/dashcard/${dashcard_id}`
        );
      } catch (altError) {
        // Approach 3: Update dashboard without the card
        const dashboard = await this.client.getDashboard(dashboard_id);
        const updatedCards = (dashboard.dashcards || []).filter(
          (card: any) => card.id !== dashcard_id
        );

        await this.client.apiCall(
          "PUT",
          `/api/dashboard/${dashboard_id}/cards`,
          { dashcards: updatedCards, tabs: dashboard.tabs || [] }
        );
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `Card with dashcard ID ${dashcard_id} removed from dashboard ${dashboard_id}`,
        },
      ],
    };
  }

  private async updateDashboardCard(args: any): Promise<any> {
    const { dashboard_id, dashcard_id, ...updateFields } = args;

    if (!dashboard_id || !dashcard_id) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Dashboard ID and Dashcard ID are required"
      );
    }

    if (Object.keys(updateFields).length === 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "No fields provided for update"
      );
    }

    let result;
    
    try {
      // Approach 1: Direct PUT to specific card
      result = await this.client.apiCall(
        "PUT",
        `/api/dashboard/${dashboard_id}/cards/${dashcard_id}`,
        updateFields
      );
    } catch (error) {
      // Approach 2: Try alternative endpoint
      try {
        result = await this.client.apiCall(
          "PUT",
          `/api/dashboard/${dashboard_id}/dashcard/${dashcard_id}`,
          updateFields
        );
      } catch (altError) {
        // Approach 3: Update entire dashboard cards array
        const dashboard = await this.client.getDashboard(dashboard_id);
        const updatedCards = (dashboard.dashcards || []).map((card: any) => {
          if (card.id === dashcard_id) {
            return { ...card, ...updateFields };
          }
          return card;
        });

        result = await this.client.apiCall(
          "PUT",
          `/api/dashboard/${dashboard_id}/cards`,
          { dashcards: updatedCards, tabs: dashboard.tabs || [] }
        );
      }
    }

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
