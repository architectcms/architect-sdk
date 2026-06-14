/**
 * Dynamic MCP tool generation from Architect CMS model definitions.
 *
 * For each content model, generates list/get/create/update/delete tools
 * with typed parameters derived from the model's field schema.
 */

import { z } from 'zod'
import * as api from './api-client.js'

/**
 * Convert a model field to a Zod schema for the tool input.
 * @param {object} field - Field definition from the model
 * @returns {import('zod').ZodTypeAny}
 */
function fieldToZodSchema(field) {
  let schema

  switch (field.type) {
    case 'string':
    case 'text':
    case 'richtext':
    case 'textarea':
    case 'email':
    case 'url':
    case 'key':
    case 'select': {
      schema = z.string()
      if (field.minLength) schema = schema.min(field.minLength)
      if (field.maxLength) schema = schema.max(field.maxLength)
      if (field.pattern) {
        try {
          schema = schema.regex(new RegExp(field.pattern))
        } catch {
          // Invalid pattern — skip constraint
        }
      }
      break
    }

    case 'number': {
      schema = z.number()
      if (field.min !== undefined && field.min !== null) schema = schema.min(field.min)
      if (field.max !== undefined && field.max !== null) schema = schema.max(field.max)
      if (field.numberType === 'integer') schema = z.number().int()
      break
    }

    case 'boolean': {
      schema = z.boolean()
      break
    }

    case 'date': {
      schema = z.string().describe((field.description || field.name) + ' (ISO 8601 date string)')
      return field.required ? schema : schema.optional()
    }

    case 'model':
    case 'relation': {
      const targetDesc = field.targetModelIds?.length
        ? `Entry ID reference to ${field.targetModelIds.join(' or ')}`
        : field.targetModelId
          ? `Entry ID reference to ${field.targetModelId}`
          : 'Entry ID reference'

      if (field.multiple) {
        schema = z.array(z.string().describe(targetDesc))
      } else {
        schema = z.string().describe(targetDesc)
      }
      break
    }

    case 'file':
    case 'image':
    case 'asset': {
      schema = z.string().describe('Asset ID')
      break
    }

    case 'json':
    case 'object': {
      schema = z.record(z.string(), z.unknown())
      break
    }

    case 'array': {
      schema = z.array(z.unknown())
      break
    }

    case 'group': {
      // Group fields contain sub-fields — flatten into an object
      if (field.fields?.length) {
        const shape = {}
        for (const subField of field.fields) {
          shape[subField.name] = fieldToZodSchema(subField)
        }
        schema = z.object(shape)
      } else {
        schema = z.record(z.string(), z.unknown())
      }
      break
    }

    default: {
      schema = z.string()
      break
    }
  }

  if (field.description) {
    schema = schema.describe(field.description)
  }

  if (!field.required) {
    schema = schema.optional()
  }

  return schema
}

/**
 * Sanitize a model name for use as a tool name suffix.
 * Converts to snake_case and removes special characters.
 */
function toToolName(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
}

/**
 * Build a one-line summary of model fields for tool descriptions.
 */
function fieldSummary(fields) {
  if (!fields?.length) return ''
  const names = fields
    .filter(f => f.type !== 'group')
    .slice(0, 8)
    .map(f => f.name)
  const suffix = fields.length > 8 ? `, +${fields.length - 8} more` : ''
  return `Fields: ${names.join(', ')}${suffix}`
}

/**
 * Generate all CRUD tools for a single model.
 * @param {object} model - Full model definition from the API
 * @returns {Array<{name: string, config: object, handler: Function}>}
 */
export function generateModelTools(model) {
  const slug = toToolName(model.name || model.id)
  const display = model.displayName || model.name || model.id
  const fields = (model.fields || []).filter(f => f.type !== 'group' || f.fields?.length)
  const tools = []

  // --- list_{model} ---
  tools.push({
    name: `list_${slug}`,
    config: {
      title: `List ${display}`,
      description: [model.description || `List ${display} entries.`, fieldSummary(fields)]
        .filter(Boolean)
        .join(' — '),
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Maximum entries to return (default 20, max 100)'),
        offset: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Number of entries to skip for pagination'),
        resolve_relations: z
          .boolean()
          .optional()
          .describe('Expand relation fields to full entry objects'),
      }),
    },
    handler: async ({ limit, offset, resolve_relations: resolveRelations }) => {
      try {
        const entries = await api.listEntries(model.id, {
          limit: limit || 20,
          offset: offset || 0,
          resolveRelations,
        })
        const results = Array.isArray(entries) ? entries : entries?.data || entries
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
  })

  // --- get_{model} ---
  tools.push({
    name: `get_${slug}`,
    config: {
      title: `Get ${display}`,
      description: `Get a single ${display} entry by ID.`,
      inputSchema: z.object({
        id: z.string().describe(`The entry ID of the ${display} to retrieve`),
        resolve_relations: z
          .boolean()
          .optional()
          .describe('Expand relation fields to full entry objects'),
      }),
    },
    handler: async ({ id, resolve_relations: resolveRelations }) => {
      try {
        const entry = await api.getEntry(id, { resolveRelations })
        return {
          content: [{ type: 'text', text: JSON.stringify(entry, null, 2) }],
        }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      }
    },
  })

  // --- create_{model} ---
  {
    const shape = {}
    for (const field of fields) {
      shape[field.name] = fieldToZodSchema(field)
    }

    tools.push({
      name: `create_${slug}`,
      config: {
        title: `Create ${display}`,
        description: [
          model.description
            ? `Create a new ${display}. ${model.description}`
            : `Create a new ${display} entry.`,
          fieldSummary(fields),
        ]
          .filter(Boolean)
          .join(' — '),
        inputSchema: z.object(shape),
      },
      handler: async args => {
        try {
          const entry = await api.createEntry(model.id, args)
          return {
            content: [{ type: 'text', text: JSON.stringify(entry, null, 2) }],
          }
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
        }
      },
    })
  }

  // --- update_{model} ---
  {
    const shape = {
      id: z.string().describe(`The entry ID of the ${display} to update`),
    }
    for (const field of fields) {
      // All fields optional on update (partial update)
      let schema = fieldToZodSchema({ ...field, required: false })
      if (!schema.isOptional?.()) {
        schema = schema.optional()
      }
      shape[field.name] = schema
    }

    tools.push({
      name: `update_${slug}`,
      config: {
        title: `Update ${display}`,
        description: `Update an existing ${display} entry. Only include fields you want to change.`,
        inputSchema: z.object(shape),
      },
      handler: async ({ id, ...data }) => {
        try {
          // Strip undefined values
          const cleanData = {}
          for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) cleanData[key] = value
          }
          const entry = await api.updateEntry(id, cleanData)
          return {
            content: [{ type: 'text', text: JSON.stringify(entry, null, 2) }],
          }
        } catch (error) {
          return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
        }
      },
    })
  }

  // --- delete_{model} ---
  tools.push({
    name: `delete_${slug}`,
    config: {
      title: `Delete ${display}`,
      description: `Delete a ${display} entry by ID.`,
      inputSchema: z.object({
        id: z.string().describe(`The entry ID of the ${display} to delete`),
      }),
    },
    handler: async ({ id }) => {
      try {
        await api.deleteEntry(id)
        return {
          content: [{ type: 'text', text: `Successfully deleted ${display} entry ${id}.` }],
        }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true }
      }
    },
  })

  return tools
}
