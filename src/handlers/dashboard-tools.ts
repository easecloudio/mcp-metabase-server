/**
 * Dashboard-related tool handlers
 */

import { MetabaseClient } from "../client/metabase-client.js";
import { ErrorCode, McpError } from "../types/errors.js";
import { TaggedTool } from "../types/tool-metadata.js";

export class DashboardToolHandlers {
  constructor(private client: MetabaseClient) {}

  getToolSchemas(): TaggedTool[] {
    return [
      {
        name: "list_dashboards",
        description: "List all dashboards in Metabase",
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["dashboard"] },
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create_dashboard",
        description: "Create a new Metabase dashboard",
        metadata: { mode: ["write", "all"], tags: ["dashboard"] },
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
        metadata: { mode: ["write", "all"], tags: ["dashboard"] },
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
            tabs: {
              type: "array",
              description:
                "Dashboard tabs. Array of { id, name, position } objects. For new tabs use negative id (-1, -2, ...). Server assigns real ids on save. When this field is provided, routed via PUT /api/dashboard/:id/cards bulk endpoint to preserve existing cards.",
              items: { type: "object" },
            },
          },
          required: ["dashboard_id"],
        },
      },
      {
        name: "delete_dashboard",
        description: "Delete a Metabase dashboard",
        metadata: { mode: ["write", "all"], tags: ["dashboard"] },
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
        metadata: { mode: ["essential", "read", "write", "all"], tags: ["dashboard"] },
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
        metadata: { mode: ["write", "all"], tags: ["dashboard"] },
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
            dashboard_tab_id: {
              type: "number",
              description:
                "ID of the dashboard tab to place this card on. Omit for dashboards without tabs.",
            },
          },
          required: ["dashboard_id", "card_id"],
        },
      },
      {
        name: "remove_card_from_dashboard",
        description: "Remove a card from a dashboard",
        metadata: { mode: ["write", "all"], tags: ["dashboard"] },
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
        metadata: { mode: ["write", "all"], tags: ["dashboard"] },
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
            dashboard_tab_id: {
              type: "number",
              description:
                "Move this card to the specified dashboard tab. Omit to leave tab unchanged.",
            },
          },
          required: ["dashboard_id", "dashcard_id"],
        },
      },
    ];
  }

  /**
   * Project an existing dashcard to the minimal schema the
   * `PUT /api/dashboard/:id/cards` endpoint accepts.
   *
   * GET responses include many derived fields (nested `card`, timestamps,
   * `inline_parameters`, etc.) that the PUT handler rejects as "Invalid
   * Request." Passing them through triggers a generic 400 with no body,
   * which in previous versions of this code silently fell through and
   * wiped the dashboard via the `cards: nil` cascade.
   */
  private toDashcardPayload(card: any, overrides: Record<string, any> = {}): any {
    const merged = { ...card, ...overrides };
    const out: any = {
      id: merged.id,
      card_id: merged.card_id ?? null,
      row: merged.row,
      col: merged.col,
      size_x: merged.size_x,
      size_y: merged.size_y,
      parameter_mappings: merged.parameter_mappings ?? [],
      visualization_settings: merged.visualization_settings ?? {},
      series: Array.isArray(merged.series)
        ? merged.series.map((s: any) => (typeof s === "number" ? s : s?.id))
            .filter((v: any) => typeof v === "number")
        : [],
    };
    if (merged.dashboard_tab_id !== undefined && merged.dashboard_tab_id !== null) {
      out.dashboard_tab_id = merged.dashboard_tab_id;
    }
    return out;
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
    const { dashboard_id, tabs, ...updateFields } = args;

    if (!dashboard_id) {
      throw new McpError(ErrorCode.InvalidParams, "Dashboard ID is required");
    }

    if (Object.keys(updateFields).length === 0 && tabs === undefined) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "No fields provided for update"
      );
    }

    let dashboard: any;

    // Metadata fields (name/description/collection_id/parameters/archived)
    // go through PUT /api/dashboard/:id as usual.
    if (Object.keys(updateFields).length > 0) {
      dashboard = await this.client.updateDashboard(dashboard_id, updateFields);
    }

    // `tabs` is not accepted by PUT /api/dashboard/:id. It must go through
    // the bulk PUT /api/dashboard/:id/cards endpoint which takes
    // `{ cards: [...], tabs: [...] }`. Preserve existing cards.
    if (tabs !== undefined) {
      const current = await this.client.getDashboard(dashboard_id);
      const existingCards = (current.dashcards || []).map((c: any) =>
        this.toDashcardPayload(c)
      );
      dashboard = await this.client.apiCall(
        "PUT",
        `/api/dashboard/${dashboard_id}/cards`,
        { cards: existingCards, tabs }
      );
    }

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
      dashboard_tab_id,
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
      const dashcardData: any = {
        cardId: card_id,
        row,
        col,
        sizeX: size_x,
        sizeY: size_y,
        parameter_mappings,
        visualization_settings,
      };
      if (dashboard_tab_id !== undefined)
        dashcardData.dashboard_tab_id = dashboard_tab_id;

      result = await this.client.apiCall(
        "POST",
        `/api/dashboard/${dashboard_id}/cards`,
        dashcardData
      );
    } catch (error) {
      // Approach 2: Use PUT to update entire dashboard cards array.
      // Metabase 0.50+ rejects a POST to /cards (404) and only accepts the
      // PUT /cards bulk endpoint with body `{cards: [...], tabs: [...]}`.
      // New cards are signalled with a negative id.
      try {
        const dashboard = await this.client.getDashboard(dashboard_id);

        const existing = (dashboard.dashcards || []).map((c: any) =>
          this.toDashcardPayload(c)
        );
        const newCard = this.toDashcardPayload({
          id: -1,
          card_id,
          row,
          col,
          size_x,
          size_y,
          parameter_mappings,
          visualization_settings,
          dashboard_tab_id,
        });

        result = await this.client.apiCall(
          "PUT",
          `/api/dashboard/${dashboard_id}/cards`,
          { cards: [...existing, newCard], tabs: dashboard.tabs || [] }
        );
      } catch (putError) {
        // Approach 3: Try alternative endpoint structure (legacy fallback)
        const alternativeData: any = {
          card_id,
          row,
          col,
          size_x,
          size_y,
          parameter_mappings,
          visualization_settings,
        };
        if (dashboard_tab_id !== undefined)
          alternativeData.dashboard_tab_id = dashboard_tab_id;

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
        // Approach 3: Update dashboard without the card via the bulk PUT
        // endpoint. Body key is `cards` (the request schema); GET responses
        // use `dashcards`. Mixing the two produces a `cards: nil` cascade
        // that archives every card on the dashboard.
        const dashboard = await this.client.getDashboard(dashboard_id);
        const updatedCards = (dashboard.dashcards || [])
          .filter((card: any) => card.id !== dashcard_id)
          .map((c: any) => this.toDashcardPayload(c));

        await this.client.apiCall(
          "PUT",
          `/api/dashboard/${dashboard_id}/cards`,
          { cards: updatedCards, tabs: dashboard.tabs || [] }
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
        // Approach 3: Update entire dashboard cards array via the bulk PUT
        // endpoint. Body key is `cards` (request schema); GET returns
        // `dashcards`. Using `dashcards` in the body leaves `cards` nil and
        // Metabase archives every card on the dashboard.
        const dashboard = await this.client.getDashboard(dashboard_id);
        const updatedCards = (dashboard.dashcards || []).map((card: any) =>
          card.id === dashcard_id
            ? this.toDashcardPayload(card, updateFields)
            : this.toDashcardPayload(card)
        );

        result = await this.client.apiCall(
          "PUT",
          `/api/dashboard/${dashboard_id}/cards`,
          { cards: updatedCards, tabs: dashboard.tabs || [] }
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
