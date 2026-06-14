/**
 * Configuration for the Architect MCP server.
 * Resolves from environment variables first, then falls back to the CLI's
 * stored credentials (~/.architect/credentials.json) so a single `architect
 * login` configures both the CLI and the MCP server.
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

function loadStoredCredentials() {
  try {
    const p = join(homedir(), '.architect', 'credentials.json')
    if (!existsSync(p)) return {}
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return {}
  }
}

const stored = loadStoredCredentials()

const config = {
  /** Base URL of the Architect API */
  apiUrl: process.env.ARCHITECT_URL || stored.baseUrl || 'http://localhost:3000',

  /** Auth credential — API key (arch_xxx) */
  apiKey: process.env.ARCHITECT_API_KEY || stored.apiKey || '',

  /** Organization ID (X-Organization header) */
  orgId: process.env.ARCHITECT_ORG_ID || stored.organizationId || '',

  /** Environment ID (X-Environment header) — mutable at runtime via switch_environment */
  envId: process.env.ARCHITECT_ENV_ID || stored.environmentId || '',
}

export default config
