#!/usr/bin/env node

/**
 * Architect CMS MCP Server
 *
 * A Model Context Protocol server that dynamically generates tools
 * from the content models defined in Architect CMS. Any MCP-compatible
 * agent can discover and operate on content without custom integration.
 *
 * Usage:
 *   ARCHITECT_URL=http://localhost:3000 \
 *   ARCHITECT_API_KEY=arch_mgmt_xxx \
 *   ARCHITECT_ORG_ID=org_123 \
 *   ARCHITECT_ENV_ID=env_456 \
 *   node services/mcp/index.js
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import config from './config.js'
import * as api from './api-client.js'
import { generateModelTools } from './tool-generator.js'
import { getStaticTools } from './static-tools.js'
import { registerResources } from './resources.js'

/** Log to stderr (stdout is reserved for the MCP protocol). */
function log(...args) {
  console.error('[architect-mcp]', ...args)
}

/**
 * Fetch models from the API and register dynamic tools.
 * Also registers static tools and resources.
 */
async function initializeServer(server) {
  // Register static tools first (always available)
  for (const tool of getStaticTools()) {
    server.registerTool(tool.name, tool.config, tool.handler)
  }
  log(`Registered ${getStaticTools().length} static tools`)

  // Fetch models and generate dynamic tools
  let models = []
  try {
    const result = await api.listModels()
    models = Array.isArray(result) ? result : result?.data || []
    log(`Fetched ${models.length} models from ${config.apiUrl}`)
  } catch (error) {
    log(`Warning: Could not fetch models from API: ${error.message}`)
    log('Dynamic model tools will not be available. Static tools are still registered.')
    log('Ensure ARCHITECT_URL, ARCHITECT_API_KEY, ARCHITECT_ORG_ID are set correctly.')
  }

  let dynamicCount = 0
  for (const model of models) {
    try {
      const tools = generateModelTools(model)
      for (const tool of tools) {
        server.registerTool(tool.name, tool.config, tool.handler)
        dynamicCount++
      }
    } catch (error) {
      log(`Warning: Could not generate tools for model "${model.id}": ${error.message}`)
    }
  }
  log(`Registered ${dynamicCount} dynamic tools from ${models.length} models`)

  // Register resources
  try {
    await registerResources(server)
    log('Registered MCP resources')
  } catch (error) {
    log(`Warning: Could not register resources: ${error.message}`)
  }
}

async function main() {
  log('Starting Architect CMS MCP Server...')
  log(`API URL: ${config.apiUrl}`)
  log(`Organization: ${config.orgId || '(not set)'}`)
  log(`Environment: ${config.envId || '(not set)'}`)

  if (!config.apiKey) {
    log('Warning: ARCHITECT_API_KEY is not set. API calls may fail with 401.')
  }

  const server = new McpServer(
    {
      name: 'architect-cms',
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
      },
    }
  )

  await initializeServer(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  log('MCP server connected via stdio. Ready for requests.')
}

main().catch(error => {
  console.error('[architect-mcp] Fatal error:', error)
  process.exit(1)
})
