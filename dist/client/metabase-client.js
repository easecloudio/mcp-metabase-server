/**
 * Metabase API Client
 * Handles all API interactions with Metabase
 */
import axios from "axios";
import { ErrorCode, McpError } from "../types/errors.js";
export class MetabaseClient {
    axiosInstance;
    sessionToken = null;
    config;
    constructor(config) {
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
        }
        else if (config.username && config.password) {
            this.logInfo("Using Metabase username/password for authentication.");
        }
        else {
            this.logError("Metabase authentication credentials not configured properly.", {});
            throw new Error("Metabase authentication credentials not provided or incomplete.");
        }
    }
    logInfo(message, data) {
        const logMessage = {
            timestamp: new Date().toISOString(),
            level: "info",
            message,
            data,
        };
        console.error(JSON.stringify(logMessage));
        console.error(`INFO: ${message}`);
    }
    logError(message, error) {
        const errorObj = error;
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
    async getSessionToken() {
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
            return this.sessionToken;
        }
        catch (error) {
            this.logError("Authentication failed", error);
            throw new McpError(ErrorCode.InternalError, "Failed to authenticate with Metabase");
        }
    }
    /**
     * Ensure authentication is ready
     */
    async ensureAuthenticated() {
        if (!this.config.apiKey) {
            await this.getSessionToken();
        }
    }
    // Dashboard operations
    async getDashboards() {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get("/api/dashboard");
        return response.data;
    }
    async getDashboard(id) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get(`/api/dashboard/${id}`);
        return response.data;
    }
    async createDashboard(dashboard) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.post("/api/dashboard", dashboard);
        return response.data;
    }
    async updateDashboard(id, updates) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.put(`/api/dashboard/${id}`, updates);
        return response.data;
    }
    async deleteDashboard(id, hardDelete = false) {
        await this.ensureAuthenticated();
        if (hardDelete) {
            await this.axiosInstance.delete(`/api/dashboard/${id}`);
        }
        else {
            await this.axiosInstance.put(`/api/dashboard/${id}`, { archived: true });
        }
    }
    // Card operations
    async getCards() {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get("/api/card");
        return response.data;
    }
    async getCard(id) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get(`/api/card/${id}`);
        return response.data;
    }
    async createCard(card) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.post("/api/card", card);
        return response.data;
    }
    async updateCard(id, updates) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.put(`/api/card/${id}`, updates);
        return response.data;
    }
    async deleteCard(id, hardDelete = false) {
        await this.ensureAuthenticated();
        if (hardDelete) {
            await this.axiosInstance.delete(`/api/card/${id}`);
        }
        else {
            await this.axiosInstance.put(`/api/card/${id}`, { archived: true });
        }
    }
    /**
     * Transform user-friendly key-value parameters into Metabase's array format
     */
    transformParameters(params) {
        if (!params || Object.keys(params).length === 0) {
            return [];
        }
        if (Array.isArray(params)) {
            return params; // Already in correct format
        }
        return Object.entries(params).map(([key, value]) => ({
            type: "category",
            target: ["variable", ["template-tag", key]],
            value: value,
        }));
    }
    async executeCard(id, parameters = {}) {
        await this.ensureAuthenticated();
        const transformedParams = this.transformParameters(parameters);
        const body = transformedParams.length > 0
            ? `parameters=${encodeURIComponent(JSON.stringify(transformedParams))}`
            : "";
        const response = await this.axiosInstance.post(`/api/card/${id}/query`, body, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return response.data;
    }
    // Database operations
    async getDatabases() {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get("/api/database");
        return response.data;
    }
    async getDatabase(id) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get(`/api/database/${id}`);
        return response.data;
    }
    async executeQuery(databaseId, query, parameters = []) {
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
    async getCollections(archived = false) {
        await this.ensureAuthenticated();
        const params = archived ? { archived: true } : {};
        const response = await this.axiosInstance.get("/api/collection", {
            params,
        });
        return response.data;
    }
    async getCollection(id) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get(`/api/collection/${id}`);
        return response.data;
    }
    async createCollection(collection) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.post("/api/collection", collection);
        return response.data;
    }
    async updateCollection(id, updates) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.put(`/api/collection/${id}`, updates);
        return response.data;
    }
    async deleteCollection(id) {
        await this.ensureAuthenticated();
        await this.axiosInstance.delete(`/api/collection/${id}`);
    }
    // User operations
    async getUsers(includeDeactivated = false) {
        await this.ensureAuthenticated();
        const params = includeDeactivated ? { include_deactivated: true } : {};
        const response = await this.axiosInstance.get("/api/user", { params });
        return response.data;
    }
    async getUser(id) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get(`/api/user/${id}`);
        return response.data;
    }
    async createUser(user) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.post("/api/user", user);
        return response.data;
    }
    async updateUser(id, updates) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.put(`/api/user/${id}`, updates);
        return response.data;
    }
    async deleteUser(id) {
        await this.ensureAuthenticated();
        await this.axiosInstance.delete(`/api/user/${id}`);
    }
    // Permission operations
    async getPermissionGroups() {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.get("/api/permissions/group");
        return response.data;
    }
    async createPermissionGroup(name) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.post("/api/permissions/group", {
            name,
        });
        return response.data;
    }
    async updatePermissionGroup(id, name) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.put(`/api/permissions/group/${id}`, { name });
        return response.data;
    }
    async deletePermissionGroup(id) {
        await this.ensureAuthenticated();
        await this.axiosInstance.delete(`/api/permissions/group/${id}`);
    }
    // Generic API method for other operations
    async apiCall(method, endpoint, data) {
        await this.ensureAuthenticated();
        const response = await this.axiosInstance.request({
            method,
            url: endpoint,
            data,
        });
        return response.data;
    }
}
