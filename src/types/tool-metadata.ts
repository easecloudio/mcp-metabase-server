import { Tool } from "@modelcontextprotocol/sdk/types.js";

export type ToolMode = "essential" | "read" | "write" | "all";

export interface ToolMetadata {
  mode: ToolMode[];    // which modes include this tool
  tags?: string[];     // optional: "dashboard", "card", "database", etc.
}

// Extend MCP Tool type with metadata
export type TaggedTool = Tool & { metadata?: ToolMetadata };
