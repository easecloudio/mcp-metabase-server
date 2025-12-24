# Metabase MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-easecloudio%2Fmcp--metabase--server-blue)](https://github.com/easecloudio/mcp-metabase-server)

A comprehensive **Model Context Protocol (MCP) server for Metabase integration**, designed for enterprises and developers who want to supercharge their AI assistants with live analytics and business intelligence.

**Developed and maintained by [EaseCloud](https://easecloud.io)** — your trusted partner for **cloud-native, AI-driven, and data infrastructure solutions.**

This is a TypeScript-based MCP server that implements full integration with Metabase API. It allows AI assistants to interact with Metabase, providing comprehensive access to:

- **Complete CRUD Operations**: Full lifecycle management for all Metabase entities
- **Advanced Dashboard Management**: Card positioning, parameters, subscriptions, and alerts
- **User & Permission Management**: Complete user lifecycle and permission system control
- **Database Management**: Connection management, schema sync, and metadata exploration
- **Analytics & Monitoring**: Usage statistics, activity tracking, and system health monitoring
- **Advanced Query Features**: Export, bookmarking, public sharing, and complex query execution
- **Search & Discovery**: Global search, popular items, and content recommendations
- **Settings & Configuration**: System settings and instance configuration management

## **70+ Tools Available** covering all major Metabase functionality for enterprise usage.

## Supported Metabase Versions

This MCP server is compatible with:
- **Metabase v0.46.x and above** (recommended: v0.48.x or later)
- **Metabase Cloud** (fully supported)
- **Self-hosted Metabase instances** (Docker, JAR, or cloud deployments)

**Note:** Some advanced features may require newer Metabase versions. For optimal compatibility, we recommend using Metabase v0.48.0 or later.

## Why We Built This

At EaseCloud, we help companies modernize their data platforms and unlock the power of AI.  
Metabase is a leading open-source BI tool — but connecting it with AI assistants like Claude, Cursor, and Windsurf requires complex API work.  

This MCP server removes that barrier by providing **70+ ready-to-use tools** that cover everything from dashboards to queries, permissions to monitoring.  

Our goal is to make **enterprise analytics accessible in natural language** while showcasing our expertise in **integration, automation, and cloud solutions.**

## Features

### Resources

- Access Metabase resources via `metabase://` URIs
- **Dashboards**: `metabase://dashboard/{id}` - Access dashboard details
- **Cards/Questions**: `metabase://card/{id}` - Access question/card details
- **Databases**: `metabase://database/{id}` - Access database information
- **Collections**: `metabase://collection/{id}` - Access collection details
- **Users**: `metabase://user/{id}` - Access user information
- **Tables**: `metabase://table/{id}` - Access table metadata
- **Fields**: `metabase://field/{id}` - Access field information
- JSON content type for structured data access

### Core Data Management Tools

#### Dashboard Management

- `list_dashboards` - List all dashboards in Metabase
- `create_dashboard` - Create a new dashboard
- `update_dashboard` - Update an existing dashboard
- `delete_dashboard` - Delete/archive a dashboard
- `get_dashboard_cards` - Get all cards in a dashboard

#### Card/Question Management

- `list_cards` - List all questions/cards in Metabase
- `create_card` - Create a new question/card
- `update_card` - Update an existing question/card
- `delete_card` - Delete/archive a question/card
- `execute_card` - Execute a card and get results

#### Database Operations

- `list_databases` - List all databases in Metabase
- `execute_query` - Execute a SQL query against a database

### Collections Management

- `list_collections` - List all collections
- `create_collection` - Create a new collection
- `update_collection` - Update an existing collection
- `delete_collection` - Delete a collection
- `get_collection_items` - Get all items in a collection
- `move_to_collection` - Move items between collections

### User & Permission Management

- `list_users` - List all users
- `create_user` - Create a new user
- `update_user` - Update user details
- `delete_user` - Deactivate a user
- `list_permissions` - List permission groups and permissions
- `list_permission_groups` - List all permission groups
- `create_permission_group` - Create a new permission group
- `update_permission_group` - Update a permission group
- `delete_permission_group` - Delete a permission group
- `add_user_to_group` - Add user to permission group
- `remove_user_from_group` - Remove user from permission group

### Advanced Query Features

- `export_card_results` - Export card results to CSV/JSON/Excel
- `export_dashboard_data` - Export dashboard data to various formats
- `bookmark_card` - Bookmark a card
- `unbookmark_card` - Remove card bookmark
- `bookmark_dashboard` - Bookmark a dashboard
- `unbookmark_dashboard` - Remove dashboard bookmark
- `list_bookmarked_items` - List all bookmarked items
- `create_public_link` - Create public sharing link
- `disable_public_link` - Disable public sharing
- `get_public_link` - Get public link information

### Database Schema Operations

- `get_database_schema` - Get database schema information
- `get_database_tables` - Get all tables in a database
- `get_table_metadata` - Get table metadata
- `get_table_fields` - Get all fields in a table
- `get_field_values` - Get field values
- `get_field_summary` - Get field summary statistics
- `analyze_field_values` - Analyze field values

### Search & Discovery

- `search_content` - Search across all Metabase content
- `get_recent_items` - Get recently viewed items
- `get_popular_items` - Get most popular cards and dashboards

### Advanced Dashboard Features

- `add_card_to_dashboard` - Add a card to a dashboard with positioning
- `remove_card_from_dashboard` - Remove a card from a dashboard
- `update_dashboard_card` - Update card position, size, and settings
- `get_dashboard_parameters` - Get dashboard parameters
- `update_dashboard_parameters` - Update dashboard parameters
- `create_dashboard_subscription` - Create dashboard subscriptions/alerts
- `list_dashboard_subscriptions` - List all dashboard subscriptions
- `update_dashboard_subscription` - Update subscription settings
- `delete_dashboard_subscription` - Delete a dashboard subscription

### Analytics & Monitoring

- `get_user_activity` - Get user activity and usage statistics
- `get_content_usage` - Get usage statistics for cards and dashboards
- `get_system_usage_stats` - Get system-wide usage statistics
- `get_system_health` - Get system health status

### Database Connection Management

- `create_database_connection` - Create new database connections
- `test_database_connection` - Test database connectivity
- `sync_database_schema` - Sync database schema metadata
- `get_database_sync_status` - Get database schema sync status

### Settings & Configuration

- `get_metabase_settings` - Get Metabase instance settings
- `update_metabase_settings` - Update instance settings

## Configuration

Before running the server, you need to set environment variables for authentication. The server supports two methods:

1.  **API Key (Preferred):**

    - `METABASE_URL`: The URL of your Metabase instance (e.g., `https://your-metabase-instance.com`).
    - `METABASE_API_KEY`: Your Metabase API key.

2.  **Username/Password (Fallback):**
    - `METABASE_URL`: The URL of your Metabase instance.
    - `METABASE_USERNAME`: Your Metabase username.
    - `METABASE_PASSWORD`: Your Metabase password.

The server will first check for `METABASE_API_KEY`. If it's set, API key authentication will be used. If `METABASE_API_KEY` is not set, the server will fall back to using `METABASE_USERNAME` and `METABASE_PASSWORD`. You must provide credentials for at least one of these methods.

**Example setup:**

Using API Key:

```bash
# Required environment variables
export METABASE_URL=https://your-metabase-instance.com
export METABASE_API_KEY=your_metabase_api_key
```

Or, using Username/Password:

```bash
# Required environment variables
export METABASE_URL=https://your-metabase-instance.com
export METABASE_USERNAME=your_username
export METABASE_PASSWORD=your_password
```

You can set these environment variables in your shell profile or use a `.env` file with a package like `dotenv`.

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## Installation & Usage

### Method 1: Using npx (Recommended)

The easiest way to run the server is using npx:

```bash
# Set environment variables
export METABASE_URL=https://your-metabase-instance.com
export METABASE_API_KEY=your_metabase_api_key

# Run the server
npx @easecloudio/mcp-metabase-server
```

### Method 2: Using Node.js directly

If you have the package installed locally or globally:

```bash
# Install globally
npm install -g @easecloudio/mcp-metabase-server

# Set environment variables
export METABASE_URL=https://your-metabase-instance.com
export METABASE_API_KEY=your_metabase_api_key

# Run the server
mcp-metabase-server
```

Or run from the built project:

```bash
# Clone and build the project
git clone https://github.com/easecloudio/mcp-metabase-server.git
cd mcp-metabase-server
npm install
npm run build

# Set environment variables
export METABASE_URL=https://your-metabase-instance.com
export METABASE_API_KEY=your_metabase_api_key

# Run the server
node dist/index.js
```

### Method 3: Using Docker

You can run the server using Docker:

```bash
# Build the Docker image
docker build -t mcp-metabase-server .

# Run the container
docker run -it --rm \
  -e METABASE_URL=https://your-metabase-instance.com \
  -e METABASE_API_KEY=your_metabase_api_key \
  mcp-metabase-server
```

Or using docker-compose:

```yaml
# docker-compose.yml
version: "3.8"
services:
  mcp-metabase-server:
    build: .
    environment:
      - METABASE_URL=https://your-metabase-instance.com
      - METABASE_API_KEY=your_metabase_api_key
    stdin_open: true
    tty: true
```

Then run:

```bash
docker-compose up
```

### Integration with Claude Desktop

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

#### Using npx:

```json
{
  "mcpServers": {
    "metabase-server": {
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

#### Using Node.js directly:

```json
{
  "mcpServers": {
    "metabase-server": {
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

#### Alternative authentication (username/password):

```json
{
  "mcpServers": {
    "metabase-server": {
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

### Environment Variables

The server supports the following environment variables:

- **METABASE_URL** (required): The URL of your Metabase instance
- **METABASE_API_KEY** (preferred): Your Metabase API key
- **METABASE_USERNAME**: Your Metabase username (fallback if API key not provided)
- **METABASE_PASSWORD**: Your Metabase password (fallback if API key not provided)

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

## Testing

After configuring the environment variables as described in the "Configuration" section, you can manually test the server's authentication. The MCP Inspector (`npm run inspector`) is a useful tool for sending requests to the server.

### 1. Testing with API Key Authentication

1.  Set the `METABASE_URL` and `METABASE_API_KEY` environment variables with your Metabase instance URL and a valid API key.
2.  Ensure `METABASE_USERNAME` and `METABASE_PASSWORD` are unset or leave them, as the API key should take precedence.
3.  Start the server: `npm run build && node build/index.js` (or use your chosen method for running the server, like via Claude Desktop config).
4.  Check the server logs. You should see a message indicating that it's using API key authentication (e.g., "Using Metabase API Key for authentication.").
5.  Using an MCP client or the MCP Inspector, try calling a tool, for example, `tools/call` with `{"name": "list_dashboards"}`.
6.  Verify that the tool call is successful and you receive the expected data.

### 2. Testing with Username/Password Authentication (Fallback)

1.  Ensure the `METABASE_API_KEY` environment variable is unset.
2.  Set `METABASE_URL`, `METABASE_USERNAME`, and `METABASE_PASSWORD` with valid credentials for your Metabase instance.
3.  Start the server.
4.  Check the server logs. You should see a message indicating that it's using username/password authentication (e.g., "Using Metabase username/password for authentication." followed by "Authenticating with Metabase using username/password...").
5.  Using an MCP client or the MCP Inspector, try calling the `list_dashboards` tool.
6.  Verify that the tool call is successful.

### 3. Testing Authentication Failures

- **Invalid API Key:**
  1.  Set `METABASE_URL` and an invalid `METABASE_API_KEY`. Ensure `METABASE_USERNAME` and `METABASE_PASSWORD` variables are unset.
  2.  Start the server.
  3.  Attempt to call a tool (e.g., `list_dashboards`). The tool call should fail, and the server logs might indicate an authentication error from Metabase (e.g., "Metabase API error: Invalid X-API-Key").
- **Invalid Username/Password:**
  1.  Ensure `METABASE_API_KEY` is unset. Set `METABASE_URL` and invalid `METABASE_USERNAME`/`METABASE_PASSWORD`.
  2.  Start the server.
  3.  Attempt to call a tool. The tool call should fail due to failed session authentication. The server logs might show "Authentication failed" or "Failed to authenticate with Metabase".
- **Missing Credentials:**
  1.  Unset `METABASE_API_KEY`, `METABASE_USERNAME`, and `METABASE_PASSWORD`. Set only `METABASE_URL`.
  2.  Attempt to start the server.
  3.  The server should fail to start and log an error message stating that authentication credentials (either API key or username/password) are required (e.g., "Either (METABASE_URL and METABASE_API_KEY) or (METABASE_URL, METABASE_USERNAME, and METABASE_PASSWORD) environment variables are required").

## About EaseCloud

EaseCloud is a cloud consulting and solutions company specializing in:
- Cloud-native application development
- AI & automation integrations
- DevOps and infrastructure management
- Data analytics and BI platform consulting

We built this project to contribute to the open-source MCP ecosystem while demonstrating our deep expertise in **data-driven decision systems.**  

👉 If your team is adopting Metabase at scale or looking to integrate AI with your BI stack, [get in touch with us](https://easecloud.io) — we provide **consulting, customization, and managed support** for enterprises.

---

💡 **Work with EaseCloud**  
Need help deploying, customizing, or scaling Metabase in production?  
We provide end-to-end support for BI, AI, and cloud infrastructure.  

📧 Contact us: [support@easecloud.io](mailto:support@easecloud.io)  
🌐 Learn more: [https://easecloud.io](https://easecloud.io)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact us at [support@easecloud.io](mailto:support@easecloud.io) or visit our website at [EaseCloud.io](https://easecloud.io).

## Bug Reports & Issues

Found a bug or have a feature request? We'd love to hear from you!

🐛 **Report Issues**: [Create a bug report on GitHub](https://github.com/easecloudio/mcp-metabase-server/issues)

When reporting issues, please include:
- Metabase version you're using
- MCP server version
- Steps to reproduce the issue
- Expected vs actual behavior
- Any error messages or logs

## Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/easecloudio/mcp-metabase-server) to submit issues or pull requests.
