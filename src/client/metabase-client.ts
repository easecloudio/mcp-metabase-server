/**
 * Metabase API Client
 * Handles all API interactions with Metabase
 */

import axios, { AxiosInstance } from "axios";
import { ErrorCode, McpError } from "../types/errors.js";
import {
  MetabaseConfig,
  Dashboard,
  Card,
  Database,
  Collection,
  User,
  Table,
  Field,
  PermissionGroup,
  QueryResult,
  MetabaseQueryParameter,
} from "../types/metabase.js";

export class MetabaseClient {
  private axiosInstance: AxiosInstance;
  private sessionToken: string | null = null;
  private config: MetabaseConfig;

  constructor(config: MetabaseConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.url,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (config.apiKey) {
      this.logInfo("Using Metabase API Key for authentication.");
      this.axiosInstance.defaults.headers.common["X-API-Key"] = config.apiKey;
      this.sessionToken = "api_key_used";
    } else if (config.username && config.password) {
      this.logInfo("Using Metabase username/password for authentication.");
    } else {
      this.logError(
        "Metabase authentication credentials not configured properly.",
        {}
      );
      throw new Error(
        "Metabase authentication credentials not provided or incomplete."
      );
    }
  }

  private logInfo(message: string, data?: unknown) {
    const logMessage = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      data,
    };
    console.error(JSON.stringify(logMessage));
    console.error(`INFO: ${message}`);
  }

  private logError(message: string, error: unknown) {
    const errorObj = error as Error;
    const logMessage = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      error: errorObj.message || "Unknown error",
      stack: errorObj.stack,
    };
    console.error(JSON.stringify(logMessage));
    console.error(`ERROR: ${message} - ${errorObj.message || "Unknown error"}`);
  }

  /**
   * Get Metabase session token for username/password authentication
   */
  private async getSessionToken(): Promise<string> {
    if (this.sessionToken) {
      return this.sessionToken;
    }

    this.logInfo("Authenticating with Metabase using username/password...");
    try {
      const response = await this.axiosInstance.post("/api/session", {
        username: this.config.username,
        password: this.config.password,
      });

      this.sessionToken = response.data.id;

      // Set default request headers
      this.axiosInstance.defaults.headers.common["X-Metabase-Session"] =
        this.sessionToken;

      this.logInfo("Successfully authenticated with Metabase");
      return this.sessionToken as string;
    } catch (error) {
      this.logError("Authentication failed", error);
      throw new McpError(
        ErrorCode.InternalError,
        "Failed to authenticate with Metabase"
      );
    }
  }

  /**
   * Ensure authentication is ready
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.config.apiKey) {
      await this.getSessionToken();
    }
  }

  // Dashboard operations
  async getDashboards(): Promise<Dashboard[]> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get("/api/dashboard");
    return response.data;
  }

  async getDashboard(id: number): Promise<Dashboard> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get(`/api/dashboard/${id}`);
    return response.data;
  }

  async createDashboard(dashboard: Partial<Dashboard>): Promise<Dashboard> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.post("/api/dashboard", dashboard);
    return response.data;
  }

  async updateDashboard(
    id: number,
    updates: Partial<Dashboard>
  ): Promise<Dashboard> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.put(
      `/api/dashboard/${id}`,
      updates
    );
    return response.data;
  }

  async deleteDashboard(
    id: number,
    hardDelete: boolean = false
  ): Promise<void> {
    await this.ensureAuthenticated();
    if (hardDelete) {
      await this.axiosInstance.delete(`/api/dashboard/${id}`);
    } else {
      await this.axiosInstance.put(`/api/dashboard/${id}`, { archived: true });
    }
  }

  // Card operations
  async getCards(): Promise<Card[]> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get("/api/card");
    return response.data;
  }

  async getCard(id: number): Promise<Card> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get(`/api/card/${id}`);
    return response.data;
  }

  async createCard(card: Partial<Card>): Promise<Card> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.post("/api/card", card);
    return response.data;
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.put(`/api/card/${id}`, updates);
    return response.data;
  }

  async deleteCard(id: number, hardDelete: boolean = false): Promise<void> {
    await this.ensureAuthenticated();
    if (hardDelete) {
      await this.axiosInstance.delete(`/api/card/${id}`);
    } else {
      await this.axiosInstance.put(`/api/card/${id}`, { archived: true });
    }
  }

  /**
   * Transform user-friendly key-value parameters into Metabase's array format
   */
  private transformParameters(
    params: Record<string, any>
  ): MetabaseQueryParameter[] {
    if (!params || Object.keys(params).length === 0) {
      return [];
    }
    if (Array.isArray(params)) {
      return params; // Already in correct format
    }
    return Object.entries(params).map(([key, value]) => ({
      type: "category",
      target: ["variable", ["template-tag", key]] as [
        "variable",
        ["template-tag", string],
      ],
      value: value,
    }));
  }

  async executeCard(id: number, parameters: any = {}): Promise<QueryResult> {
    await this.ensureAuthenticated();

    const transformedParams = this.transformParameters(parameters);
    const body =
      transformedParams.length > 0
        ? `parameters=${encodeURIComponent(JSON.stringify(transformedParams))}`
        : "";

    const response = await this.axiosInstance.post(
      `/api/card/${id}/query`,
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  }

  // Database operations
  async getDatabases(): Promise<Database[]> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get("/api/database");
    return response.data;
  }

  async getDatabase(id: number): Promise<Database> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get(`/api/database/${id}`);
    return response.data;
  }

  async executeQuery(
    databaseId: number,
    query: string,
    parameters: any[] = []
  ): Promise<QueryResult> {
    await this.ensureAuthenticated();
    const queryData = {
      type: "native",
      native: {
        query: query,
        template_tags: {},
      },
      parameters: parameters,
      database: databaseId,
    };
    const response = await this.axiosInstance.post("/api/dataset", queryData);
    return response.data;
  }

  // Collection operations
  async getCollections(archived: boolean = false): Promise<Collection[]> {
    await this.ensureAuthenticated();
    const params = archived ? { archived: true } : {};
    const response = await this.axiosInstance.get("/api/collection", {
      params,
    });
    return response.data;
  }

  async getCollection(id: number): Promise<Collection> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get(`/api/collection/${id}`);
    return response.data;
  }

  async createCollection(collection: Partial<Collection>): Promise<Collection> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.post(
      "/api/collection",
      collection
    );
    return response.data;
  }

  async updateCollection(
    id: number,
    updates: Partial<Collection>
  ): Promise<Collection> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.put(
      `/api/collection/${id}`,
      updates
    );
    return response.data;
  }

  async deleteCollection(id: number): Promise<void> {
    await this.ensureAuthenticated();
    await this.axiosInstance.delete(`/api/collection/${id}`);
  }

  // User operations
  async getUsers(includeDeactivated: boolean = false): Promise<User[]> {
    await this.ensureAuthenticated();
    const params = includeDeactivated ? { include_deactivated: true } : {};
    const response = await this.axiosInstance.get("/api/user", { params });
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get(`/api/user/${id}`);
    return response.data;
  }

  async createUser(user: Partial<User>): Promise<User> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.post("/api/user", user);
    return response.data;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.put(`/api/user/${id}`, updates);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.ensureAuthenticated();
    await this.axiosInstance.delete(`/api/user/${id}`);
  }

  // Permission operations
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.get("/api/permissions/group");
    return response.data;
  }

  async createPermissionGroup(name: string): Promise<PermissionGroup> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.post("/api/permissions/group", {
      name,
    });
    return response.data;
  }

  async updatePermissionGroup(
    id: number,
    name: string
  ): Promise<PermissionGroup> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.put(
      `/api/permissions/group/${id}`,
      { name }
    );
    return response.data;
  }

  async deletePermissionGroup(id: number): Promise<void> {
    await this.ensureAuthenticated();
    await this.axiosInstance.delete(`/api/permissions/group/${id}`);
  }

  // Generic API method for other operations
  async apiCall(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any
  ): Promise<any> {
    await this.ensureAuthenticated();
    const response = await this.axiosInstance.request({
      method,
      url: endpoint,
      data,
    });
    return response.data;
  }
}
