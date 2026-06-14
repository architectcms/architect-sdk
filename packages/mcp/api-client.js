/**
 * HTTP client for the Architect REST API.
 * All tool calls proxy through this client.
 */

import config from './config.js'

/**
 * Build standard headers for Architect API requests.
 */
function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  if (config.apiKey) {
    // API keys start with 'arch_', JWT tokens start with 'eyJ'
    if (config.apiKey.startsWith('arch_')) {
      headers['X-Api-Key'] = config.apiKey
    } else {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }
  }
  if (config.orgId) {
    headers['X-Organization'] = config.orgId
  }
  if (config.envId) {
    headers['X-Environment'] = config.envId
  }
  return headers
}

/**
 * Make an HTTP request to the Architect API.
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g. '/api/models')
 * @param {object} [body] - Request body for POST/PUT
 * @param {object} [queryParams] - URL query parameters
 * @returns {Promise<{status: number, data: any}>}
 */
async function request(method, path, body, queryParams) {
  const url = new URL(path, config.apiUrl)
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const options = {
    method,
    headers: buildHeaders(),
  }
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url.toString(), options)
  const status = response.status

  if (status === 204) {
    return { status, data: null }
  }

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (status >= 400) {
    const message = data?.message || data?.error || text || `HTTP ${status}`
    throw new ApiError(message, status, data)
  }

  return { status, data }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// --- Model endpoints ---

export async function listModels() {
  const { data } = await request('GET', '/api/models')
  return data
}

export async function getModel(modelId) {
  const { data } = await request('GET', `/api/models/${encodeURIComponent(modelId)}`)
  return data
}

// --- Entry endpoints ---

export async function listEntries(modelId, params = {}) {
  const { data } = await request('GET', `/api/entries/model/${encodeURIComponent(modelId)}`, null, {
    limit: params.limit,
    offset: params.offset,
    resolveRelations: params.resolveRelations,
  })
  return data
}

export async function getEntry(entryId, params = {}) {
  const { data } = await request('GET', `/api/entries/${encodeURIComponent(entryId)}`, null, {
    showDebug: params.showDebug,
  })
  return data
}

export async function createEntry(modelId, entryData) {
  const { data } = await request('POST', '/api/entries', {
    modelId,
    data: entryData,
  })
  return data
}

export async function updateEntry(entryId, entryData) {
  const { data } = await request('PUT', `/api/entries/${encodeURIComponent(entryId)}`, {
    data: entryData,
  })
  return data
}

export async function deleteEntry(entryId) {
  await request('DELETE', `/api/entries/${encodeURIComponent(entryId)}`)
  return { success: true }
}

export async function getIncomingReferences(entryId) {
  const { data } = await request(
    'GET',
    `/api/entries/${encodeURIComponent(entryId)}/incoming-references`
  )
  return data
}

// --- Environment endpoints ---

export async function listEnvironments() {
  const { data } = await request('GET', '/api/environments')
  return data
}

// --- Search (uses the entries endpoint with text filter) ---

export async function searchEntries(query, params = {}) {
  const { data } = await request('GET', '/api/entries/recent', null, {
    limit: params.limit || 50,
  })
  // Client-side text filter since the API doesn't have a dedicated global search
  if (!query || !data) return data
  const lower = query.toLowerCase()
  const results = Array.isArray(data) ? data : data.data || []
  return results.filter(entry => {
    const dataStr = JSON.stringify(entry.data || {}).toLowerCase()
    return dataStr.includes(lower)
  })
}
