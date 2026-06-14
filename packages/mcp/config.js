/**
 * Configuration for the Architect MCP server.
 * Reads from environment variables with sensible defaults.
 */

const config = {
  /** Base URL of the Architect API */
  apiUrl: process.env.ARCHITECT_URL || 'http://localhost:3000',

  /** Auth credential — API key (arch_xxx) or JWT token for authentication */
  apiKey: process.env.ARCHITECT_API_KEY || '',

  /** Organization ID (X-Organization header) */
  orgId: process.env.ARCHITECT_ORG_ID || '',

  /** Environment ID (X-Environment header) — mutable at runtime via switch_environment */
  envId: process.env.ARCHITECT_ENV_ID || '',
}

export default config
