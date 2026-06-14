/**
 * MCP resource definitions for Architect CMS.
 * Exposes models and entries as browsable resources.
 */

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as api from './api-client.js'

/**
 * Register all MCP resources on the server.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export async function registerResources(server) {
  // --- architect://models/{modelId} ---
  server.registerResource(
    'model-definition',
    new ResourceTemplate('architect://models/{modelId}', {
      list: async () => {
        try {
          const models = await api.listModels()
          const list = Array.isArray(models) ? models : models?.data || []
          return {
            resources: list.map(m => ({
              uri: `architect://models/${m.id}`,
              name: m.displayName || m.name || m.id,
              description: m.description || `${m.name} content model`,
              mimeType: 'application/json',
            })),
          }
        } catch {
          return { resources: [] }
        }
      },
    }),
    {
      title: 'Model Definition',
      description: 'Content model definition with fields, validation rules, and metadata',
      mimeType: 'application/json',
    },
    async (uri, { modelId }) => {
      const model = await api.getModel(modelId)
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(model, null, 2),
            mimeType: 'application/json',
          },
        ],
      }
    }
  )

  // --- architect://entries/{entryId} ---
  server.registerResource(
    'entry-data',
    new ResourceTemplate('architect://entries/{entryId}', {
      list: undefined, // Too many entries to enumerate
    }),
    {
      title: 'Entry Data',
      description: 'Content entry with field values and metadata',
      mimeType: 'application/json',
    },
    async (uri, { entryId }) => {
      const entry = await api.getEntry(entryId)
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(entry, null, 2),
            mimeType: 'application/json',
          },
        ],
      }
    }
  )
}
