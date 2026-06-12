import { ArchitectManagement } from '@architect-cms/sdk'
import { saveCredentials, type StoredCredentials } from '../credentials'

/**
 * Log in with a management API key. Validates the key/org/env by making one
 * read call through the SDK, then persists the credentials.
 *
 * The CLI authenticates exactly like the SDK — with a management key. There is
 * no browser/OAuth flow: the CLI talks to the API only through the SDK.
 */
export async function loginWithToken(c: StoredCredentials): Promise<void> {
  if (!c.apiKey.startsWith('arch_mgmt_')) {
    throw new Error('Expected a management key (starts with "arch_mgmt_").')
  }
  // Validate by listing models — fails fast on a bad key/org/env.
  const client = new ArchitectManagement(c)
  await client.models.list()
  saveCredentials(c)
}
