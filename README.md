# Metabase MCP Server

[![npm version](https://img.shields.io/npm/v/@easecloudio/mcp-metabase-server)](https://www.npmjs.com/package/@easecloudio/mcp-metabase-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-easecloudio%2Fmcp--metabase--server-blue)](https://github.com/easecloudio/mcp-metabase-server)

A **Model Context Protocol (MCP) server for Metabase** that gives AI assistants full access to your analytics platform — dashboards, cards, databases, tables, collections, and more.

**Developed and maintained by [EaseCloud](https://easecloud.io)** — cloud-native, AI-driven, and data infrastructure solutions.

## Quick Start

```bash
export METABASE_URL=https://your-metabase-instance.com
export METABASE_API_KEY=your_metabase_api_key
npx @easecloudio/mcp-metabase-server
```

## 64 Tools Available

| Domain | Tools |
|---|---|
| Dashboard Management | 16 |
| Card / Question Management | 14 |
| Database Management | 12 |
| Table Management | 9 |
| Collections, Users & Search | 11 |
| Schema Cache (SQL→MBQL) | 2 |

## Supported Metabase Versions

- Metabase v0.46.x and above (recommended: v0.48.x or later)
- Metabase Cloud (fully supported)
- Self-hosted instances (Docker, JAR, or cloud deployments)

## Installation

### npx (Recommended)

```bash
npx @easecloudio/mcp-metabase-server
```

### Global install

```bash
npm install -g @easecloudio/mcp-metabase-server
mcp-metabase-server
```

### Docker

```bash
docker build -t mcp-metabase-server .
docker run -it --rm \
  -e METABASE_URL=https://your-metabase-instance.com \
  -e METABASE_API_KEY=your_metabase_api_key \
  mcp-metabase-server
```

## Configuration

### Authentication

**API Key (preferred):**

```bash
METABASE_URL=https://your-metabase-instance.com
METABASE_API_KEY=your_metabase_api_key
```

**Username / Password (fallback):**

```bash
METABASE_URL=https://your-metabase-instance.com
METABASE_USERNAME=your_username
METABASE_PASSWORD=your_password
```

Copy `.env.example` to `.env` and fill in your values.

### Tool Filtering (TOOL_MODE)

Set `TOOL_MODE` to control which tools are exposed to the AI. Useful for limiting surface area or preventing accidental writes.

| Mode | Description |
|---|---|
| `all` | Every available tool (default) |
| `essential` | Core read + execute tools only |
| `read` | All non-destructive tools |
| `write` | All tools including create / update / delete |

```bash
TOOL_MODE=essential  # smallest surface area
TOOL_MODE=read       # read-only
TOOL_MODE=all        # everything (default)
```

## Claude Desktop Integration

MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%/Claude/claude_desktop_config.json`

**Using npx:**

```json
{
  "mcpServers": {
    "metabase": {
      "command": "npx",
      "args": ["@easecloudio/mcp-metabase-server"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

**With tool filtering:**

```json
{
  "mcpServers": {
    "metabase": {
      "command": "npx",
      "args": ["@easecloudio/mcp-metabase-server"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key",
        "TOOL_MODE": "essential"
      }
    }
  }
}
```

**Using a local build:**

```json
{
  "mcpServers": {
    "metabase": {
      "command": "node",
      "args": ["/path/to/metabase-server/dist/index.js"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

**Username / password fallback:**

```json
{
  "mcpServers": {
    "metabase": {
      "command": "npx",
      "args": ["@easecloudio/mcp-metabase-server"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_USERNAME": "your_username",
        "METABASE_PASSWORD": "your_password"
      }
    }
  }
}
```

## Available Tools

<details>
<summary><strong>Dashboard Management (16 tools)</strong></summary>

### Core CRUD
| Tool | Description |
|---|---|
| `list_dashboards` | List all dashboards |
| `create_dashboard` | Create a new dashboard |
| `update_dashboard` | Update an existing dashboard |
| `delete_dashboard` | Delete / archive a dashboard |
| `copy_dashboard` | Duplicate a dashboard (shallow or deep copy) |

### Card Layout
| Tool | Description |
|---|---|
| `get_dashboard_cards` | Get all cards in a dashboard |
| `add_card_to_dashboard` | Add a card with positioning |
| `remove_card_from_dashboard` | Remove a card |
| `update_dashboard_card` | Update card position, size, and settings |

### Public Sharing & Embedding
| Tool | Description |
|---|---|
| `create_dashboard_public_link` | Create a public sharing link |
| `delete_dashboard_public_link` | Remove the public link |
| `list_public_dashboards` | List dashboards with public links |
| `list_embeddable_dashboards` | List dashboards enabled for embedding |

### Revision & Discovery
| Tool | Description |
|---|---|
| `get_dashboard_revisions` | Get revision history (audit trail) |
| `revert_dashboard` | Revert to a previous revision |
| `get_dashboard_related` | Get related content suggestions |

</details>

<details>
<summary><strong>Card / Question Management (14 tools)</strong></summary>

### Core CRUD
| Tool | Description |
|---|---|
| `list_cards` | List all questions / cards |
| `get_card` | Get a card by ID (includes full SQL / MBQL query) |
| `create_card` | Create a new question |
| `update_card` | Update an existing question |
| `delete_card` | Delete / archive a question |
| `copy_card` | Duplicate a card |

### Execution & Export
| Tool | Description |
|---|---|
| `execute_card` | Run a card and return results |
| `export_card_result` | Export results as CSV or JSON |

### Metadata & Discovery
| Tool | Description |
|---|---|
| `get_card_query_metadata` | Get column types and display names |
| `get_card_dashboards` | List dashboards containing this card |

### Public Sharing & Embedding
| Tool | Description |
|---|---|
| `create_card_public_link` | Create a public sharing link |
| `delete_card_public_link` | Remove the public link |
| `list_public_cards` | List cards with public links |
| `list_embeddable_cards` | List cards enabled for embedding |

</details>

<details>
<summary><strong>Database Management (12 tools)</strong></summary>

### Core Operations
| Tool | Description |
|---|---|
| `list_databases` | List all database connections |
| `execute_query` | Execute a SQL query against a database |
| `create_database_connection` | Create a new database connection |

### Schema & Sync
| Tool | Description |
|---|---|
| `get_database_schema` | Get schema information |
| `get_database_tables` | Get all tables in a database |
| `get_database_metadata` | Get full metadata including all tables and field IDs |
| `list_database_schemas` | List all schemas within a database |
| `sync_database_schema` | Trigger a schema metadata sync |
| `get_database_sync_status` | Check sync status |

### Diagnostics
| Tool | Description |
|---|---|
| `check_database_health` | Check connection health |
| `validate_database` | Validate connection settings before saving |
| `test_database_connection` | Test an existing connection |

</details>

<details>
<summary><strong>Table Management (9 tools)</strong></summary>

### Metadata
| Tool | Description |
|---|---|
| `list_tables` | List tables (optionally filtered by database) |
| `get_table` | Get table metadata by ID |
| `get_table_metadata` | Get full query metadata including field IDs and types |
| `get_table_fks` | Get foreign key relationships |
| `get_field_id` | Look up a field ID by table ID + column name (returns MBQL ref) |

### Management
| Tool | Description |
|---|---|
| `update_table` | Update display name, description, or visibility |
| `sync_table_schema` | Trigger a schema sync for a specific table |
| `rescan_table_field_values` | Rescan field values (updates filter dropdowns) |
| `discard_table_field_values` | Discard cached field values |

</details>

<details>
<summary><strong>Collections, Users & Search (11 tools)</strong></summary>

### Collections
| Tool | Description |
|---|---|
| `list_collections` | List all collections |
| `create_collection` | Create a new collection |
| `get_collection` | Get collection details |
| `update_collection` | Update name, description, color, or parent |
| `delete_collection` | Delete a collection and its contents |
| `get_collection_items` | List cards, dashboards, and sub-collections |

### Users
| Tool | Description |
|---|---|
| `list_users` | List all users |
| `create_user` | Create a new user |

### Permissions
| Tool | Description |
|---|---|
| `list_permission_groups` | List all permission groups |
| `create_permission_group` | Create a new permission group |

### Search
| Tool | Description |
|---|---|
| `search_content` | Search across all Metabase content |

</details>

<details>
<summary><strong>Schema Cache — SQL to MBQL (2 tools)</strong></summary>

These tools enable an AI to convert native SQL questions into interactive MBQL questions. Metabase has no REST API for this conversion — it requires field IDs, which these tools cache locally.

**How it works:**

1. `get_card` — extract the SQL and `database_id`
2. `get_schema_cache` — get tables + field IDs for MBQL references like `["field", 42, null]`
3. AI translates SQL → MBQL using the cached field IDs
4. `create_card` — save the new interactive question

Cache is stored at `~/.easecloud/metabase-mcp/cache/{url-hash}/` with a 24-hour TTL and scoped per Metabase instance.

| Tool | Description |
|---|---|
| `get_schema_cache` | Return cached schema (auto-fetches if missing or stale) |
| `refresh_schema_cache` | Force-refresh cache for one or all databases |

</details>

## MCP Resources

Access Metabase entities directly via `metabase://` URIs:

| URI | Description |
|---|---|
| `metabase://dashboard/{id}` | Dashboard details |
| `metabase://card/{id}` | Card / question details |
| `metabase://database/{id}` | Database information |
| `metabase://collection/{id}` | Collection details |
| `metabase://user/{id}` | User information |
| `metabase://table/{id}` | Table metadata |
| `metabase://field/{id}` | Field information |

## Development

```bash
npm install
npm run build       # compile TypeScript → dist/
npm run watch       # incremental rebuild
npm run dev         # build + start
npm run inspector   # launch MCP Inspector for debugging
```

## Debugging

MCP servers communicate over stdio, which makes direct debugging awkward. Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npm run inspector
```

The Inspector provides a browser UI for sending tool calls and inspecting responses.

## About EaseCloud

EaseCloud is a cloud consulting and solutions company specializing in:

- Cloud-native application development
- AI & automation integrations
- DevOps and infrastructure management
- Data analytics and BI platform consulting

We built this project to contribute to the open-source MCP ecosystem while demonstrating our expertise in integration, automation, and cloud solutions.

If your team is adopting Metabase at scale or looking to integrate AI with your BI stack, [get in touch](https://easecloud.io) — we provide consulting, customization, and managed support for enterprises.

📧 [support@easecloud.io](mailto:support@easecloud.io)
🌐 [easecloud.io](https://easecloud.io)

## Bug Reports & Issues

Found a bug or have a feature request?

🐛 [Create a GitHub issue](https://github.com/easecloudio/mcp-metabase-server/issues)

Please include:
- Metabase version
- MCP server version
- Steps to reproduce
- Expected vs actual behavior
- Any error messages or logs

## Contributing

Contributions are welcome. Visit the [GitHub repository](https://github.com/easecloudio/mcp-metabase-server) to submit issues or pull requests.

## License

MIT — see [LICENSE](LICENSE) for details.
