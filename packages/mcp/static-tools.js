/**
 * Static MCP tools that don't depend on dynamic model discovery.
 * These provide general-purpose operations on the Architect CMS.
 */

import { z } from 'zod'
import * as api from './api-client.js'
import config from './config.js'

/**
 * Returns all static tool definitions.
 * @returns {Array<{name: string, config: object, handler: Function}>}
 */
export function getStaticTools() {
  return [
    // --- list_models ---
    {
      name: 'list_models',
      config: {
        title: 'List Models',
        description:
          'List all content models defined in Architect CMS, including their fields and metadata.',
        inputSchema: z.object({
          include_fields: z
            .boolean()
            .optional()
            .describe('Include full field definitions in the response (default true)'),
        }),
      },
      handler: async ({ include_fields: includeFields }) => {
        try {
          const models = await api.listModels()
          const results = Array.isArray(models) ? models : models?.data || []
          const output =
            includeFields === false
              ? results.map(m => ({
                  id: m.id,
                  name: m.name,
                  displayName: m.displayName,
                  description: m.description,
                  category: m.category,
                  type: m.type,
                  fieldCount: m.fields?.length || 0,
                }))
              : results
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          }
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
        }
      },
    },

    // --- search_entries ---
    {
      name: 'search_entries',
      config: {
        title: 'Search Entries',
        description:
          'Search for entries across all models by text query. Returns matching entries from any content type.',
        inputSchema: z.object({
          query: z.string().describe('Text to search for in entry data'),
          limit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .describe('Maximum results to return (default 50)'),
        }),
      },
      handler: async ({ query, limit }) => {
        try {
          const results = await api.searchEntries(query, { limit })
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          }
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
        }
      },
    },

    // --- get_entry_references ---
    {
      name: 'get_entry_references',
      config: {
        title: 'Get Entry References',
        description:
          'Get all incoming references to an entry — find which other entries link to it via relation fields.',
        inputSchema: z.object({
          entry_id: z.string().describe('The entry ID to find references for'),
        }),
      },
      handler: async ({ entry_id: entryId }) => {
        try {
          const refs = await api.getIncomingReferences(entryId)
          return {
            content: [{ type: 'text', text: JSON.stringify(refs, null, 2) }],
          }
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
        }
      },
    },

    // --- list_environments ---
    {
      name: 'list_environments',
      config: {
        title: 'List Environments',
        description: 'List all available environments (e.g. development, staging, production).',
        inputSchema: z.object({}),
      },
      handler: async () => {
        try {
          const envs = await api.listEnvironments()
          const results = Array.isArray(envs) ? envs : envs?.data || []
          const output = results.map(e => ({
            ...e,
            active: e.id === config.envId ? '(active)' : '',
          }))
          return {
            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
          }
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
        }
      },
    },

    // --- switch_environment ---
    {
      name: 'switch_environment',
      config: {
        title: 'Switch Environment',
        description:
          'Change the active environment for all subsequent API calls. Use list_environments to see available options.',
        inputSchema: z.object({
          environment_id: z.string().describe('The environment ID to switch to'),
        }),
      },
      handler: async ({ environment_id: envId }) => {
        const previous = config.envId
        config.envId = envId
        return {
          content: [
            {
              type: 'text',
              text: `Switched environment from "${previous || '(none)'}" to "${envId}". All subsequent calls will target this environment.`,
            },
          ],
        }
      },
    },
  ]
}
