# Architect CMS MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) server that dynamically generates tools from the content models defined in Architect CMS. Any MCP-compatible agent (Claude Desktop, Cursor, etc.) can discover and operate on your content without custom integration code.

## How It Works

On startup, the server:

1. Connects to the Architect CMS API
2. Fetches all content models and their field definitions
3. Generates typed CRUD tools for each model (list, get, create, update, delete)
4. Registers static utility tools (search, environments, references)
5. Exposes models and entries as MCP resources

For example, if you have a **Product** model with fields `name` (string, required), `price` (number), and `category` (relation to Category), the server generates:

- `list_product` — List products with pagination
- `get_product` — Get a product by ID
- `create_product` — Create with typed params: `name` (string, required), `price` (number), `category` (string entry ID)
- `update_product` — Partial update with the same typed params
- `delete_product` — Delete by ID

Field descriptions, validation rules (min/max, patterns), and relation targets all flow into the tool schemas so agents understand the data model.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Set these environment variables:

| Variable            | Required | Default                 | Description                                 |
| ------------------- | -------- | ----------------------- | ------------------------------------------- |
| `ARCHITECT_URL`     | No       | `http://localhost:3000` | Architect API base URL                      |
| `ARCHITECT_API_KEY` | Yes      | —                       | API key (e.g. `arch_mgmt_xxx`)              |
| `ARCHITECT_ORG_ID`  | Yes      | —                       | Organization ID                             |
| `ARCHITECT_ENV_ID`  | No       | —                       | Environment ID (can be switched at runtime) |

### 3. Run

```bash
# From the project root
npm run mcp

# Or directly
ARCHITECT_URL=http://localhost:3000 \
ARCHITECT_API_KEY=arch_mgmt_xxx \
ARCHITECT_ORG_ID=org_123 \
ARCHITECT_ENV_ID=env_456 \
node services/mcp/index.js
```

## Claude Desktop Configuration

Add to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "architect-cms": {
      "command": "node",
      "args": ["/path/to/architect/services/mcp/index.js"],
      "env": {
        "ARCHITECT_URL": "http://localhost:3000",
        "ARCHITECT_API_KEY": "arch_mgmt_xxx",
        "ARCHITECT_ORG_ID": "org_123",
        "ARCHITECT_ENV_ID": "env_456"
      }
    }
  }
}
```

## Claude Code Configuration

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "architect-cms": {
      "command": "node",
      "args": ["services/mcp/index.js"],
      "env": {
        "ARCHITECT_URL": "http://localhost:3000",
        "ARCHITECT_API_KEY": "arch_mgmt_xxx",
        "ARCHITECT_ORG_ID": "org_123",
        "ARCHITECT_ENV_ID": "env_456"
      }
    }
  }
}
```

## Available Tools

### Dynamic (per model)

For each content model, these tools are generated:

| Tool             | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `list_{model}`   | List entries with pagination, optional relation expansion |
| `get_{model}`    | Get single entry by ID                                    |
| `create_{model}` | Create entry with typed fields from the model schema      |
| `update_{model}` | Partial update — only include fields to change            |
| `delete_{model}` | Delete entry by ID                                        |

### Static

| Tool                   | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `list_models`          | List all content models with their fields      |
| `search_entries`       | Full-text search across all models             |
| `get_entry_references` | Find which entries link to a given entry       |
| `list_environments`    | List available environments                    |
| `switch_environment`   | Change active environment for subsequent calls |

## MCP Resources

| URI Pattern                     | Description                  |
| ------------------------------- | ---------------------------- |
| `architect://models/{modelId}`  | Model definition with fields |
| `architect://entries/{entryId}` | Entry data with metadata     |

## Field Type Mapping

| Architect Type                     | MCP Schema | Notes                                       |
| ---------------------------------- | ---------- | ------------------------------------------- |
| string, text, richtext, email, url | `string`   | With minLength/maxLength/pattern if set     |
| number                             | `number`   | With min/max; `integer` for integer subtype |
| boolean                            | `boolean`  |                                             |
| date                               | `string`   | Described as ISO 8601                       |
| model/relation (single)            | `string`   | "Entry ID reference to {target}"            |
| model/relation (multiple)          | `string[]` | Array of entry IDs                          |
| file, image, asset                 | `string`   | "Asset ID"                                  |
| json                               | `object`   | Record of unknown values                    |
| group                              | `object`   | Flattened sub-fields                        |

## Architecture

```
services/mcp/
├── index.js           # Entry point — creates server, fetches models, connects stdio
├── config.js          # Environment variable configuration
├── api-client.js      # HTTP client for the Architect REST API
├── tool-generator.js  # Converts model definitions to MCP tools
├── static-tools.js    # Static utility tools
├── resources.js       # MCP resource definitions
├── package.json       # Service dependencies
└── README.md          # This file
```

The server is a standalone process that communicates with the Architect API over HTTP. It does not import internal services directly — it proxies all operations through the REST API, making it deployable independently.
