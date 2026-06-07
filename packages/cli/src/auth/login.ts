import { ArchitectManagement } from '@architect-cms/sdk'
import { input, select } from '@inquirer/prompts'
import { saveCredentials, type StoredCredentials } from '../credentials'
import { getGoogleIdToken } from './google-loopback'

export async function loginWithToken(c: StoredCredentials): Promise<void> {
  if (!c.apiKey.startsWith('arch_mgmt_')) {
    throw new Error('Expected a management key (starts with "arch_mgmt_").')
  }
  // Validate by listing models — fails fast on a bad key/org/env.
  const client = new ArchitectManagement(c)
  await client.models.list()
  saveCredentials(c)
}

// ---------------------------------------------------------------------------
// Google login (browser PKCE loopback).
//
// This is the ONE place the CLI talks HTTP directly: the JWT-based auth /
// onboarding / key-mint bootstrap that the SDK (which models content APIs)
// deliberately doesn't cover. Everything post-login goes through the SDK.
// API shapes verified against the `architect` repo (auth.js, onboarding.js,
// organizations.js, apiKeys.js).
// ---------------------------------------------------------------------------

/** The Google "Desktop app" OAuth client id (Prerequisite 1). */
function resolveClientId(): string {
  const id = process.env.GOOGLE_CLI_CLIENT_ID
  if (!id) {
    throw new Error(
      'Google login is not configured: set GOOGLE_CLI_CLIENT_ID to a Google ' +
      '"Desktop app" OAuth client id. (Or use `architect login --with-token`.)',
    )
  }
  return id
}

interface GoogleAuthResponse {
  token: string
  user: { id: string; username?: string }
  environmentAccess?: Array<{ environmentId: string; accessLevel?: string }>
  needsOnboarding?: boolean
}

async function postJson<T>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Request to ${url} failed (${res.status})`)
  }
  return json as T
}

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...headers } })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `Request to ${url} failed (${res.status})`)
  }
  return json as T
}

/** Resolve the org & env to use, creating an org for brand-new users. */
async function resolveOrgAndEnv(
  baseUrl: string,
  auth: GoogleAuthResponse,
  orgNameOverride?: string,
): Promise<{ organizationId: string; environmentId: string }> {
  const bearer = { Authorization: `Bearer ${auth.token}` }

  if (auth.needsOnboarding) {
    const name = orgNameOverride ?? (await input({ message: 'Name your organization:' }))
    const onboarding = await postJson<{
      organization: { id: string }
      environment: { id: string }
    }>(`${baseUrl}/api/onboarding/create-organization`, { name }, bearer)
    return {
      organizationId: onboarding.organization.id,
      environmentId: onboarding.environment.id,
    }
  }

  // Returning user: pick the organization…
  const orgs = await getJson<Array<{ id: string; name?: string }>>(
    `${baseUrl}/api/organizations`,
    bearer,
  )
  if (!orgs.length) {
    throw new Error('No organizations found for this account.')
  }
  const organizationId =
    orgs.length === 1
      ? orgs[0].id
      : await select({
          message: 'Select an organization:',
          choices: orgs.map(o => ({ name: `${o.name ?? o.id} (${o.id})`, value: o.id })),
        })

  // …then the environment (from the accessible environments on the auth response).
  const envs = auth.environmentAccess ?? []
  if (!envs.length) {
    throw new Error('No environment access found for this account.')
  }
  const environmentId =
    envs.length === 1
      ? envs[0].environmentId
      : await select({
          message: 'Select an environment:',
          choices: envs.map(e => ({ name: e.environmentId, value: e.environmentId })),
        })

  return { organizationId, environmentId }
}

/**
 * Full Google login: browser PKCE → app JWT → resolve/create org+env → mint a
 * management key → persist credentials.
 */
export async function loginWithGoogle(baseUrl: string, orgNameOverride?: string): Promise<void> {
  const clientId = resolveClientId()
  const idToken = await getGoogleIdToken(clientId)

  // 1. Exchange the Google ID token for an app JWT.
  const auth = await postJson<GoogleAuthResponse>(`${baseUrl}/api/auth/google`, {
    credential: idToken,
  })

  // 2. Resolve (or create) the target org + env.
  const { organizationId, environmentId } = await resolveOrgAndEnv(baseUrl, auth, orgNameOverride)

  // 3. Mint a management key (requires JWT + org/env headers; caller is org_owner).
  const minted = await postJson<{ fullKey: string }>(
    `${baseUrl}/api/api-keys`,
    { name: 'CLI', type: 'management' },
    {
      Authorization: `Bearer ${auth.token}`,
      'X-Organization': organizationId,
      'X-Environment': environmentId,
    },
  )
  if (!minted.fullKey?.startsWith('arch_mgmt_')) {
    throw new Error('Server did not return a management key.')
  }

  // 4. Persist.
  saveCredentials({ apiKey: minted.fullKey, organizationId, environmentId, baseUrl })
}
