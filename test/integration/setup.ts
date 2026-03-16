import { ArchitectDelivery } from '../../src/client'
import { ArchitectPreview } from '../../src/preview'
import { ArchitectManagement } from '../../src/management'

const BASE_URL = process.env.ARCHITECT_TEST_BASE_URL || 'http://localhost:3000'
const ADMIN_USER = process.env.ARCHITECT_TEST_USERNAME || 'admin'
const ADMIN_PASS = process.env.ARCHITECT_TEST_PASSWORD || process.env.ADMIN_PASSWORD || ''

export interface TestContext {
  client: ArchitectDelivery
  previewClient: ArchitectPreview
  managementClient: ArchitectManagement
  apiKey: string
  previewApiKey: string
  managementApiKey: string
  organizationId: string
  environmentId: string
  baseUrl: string
  testModelId: string
  testModelName: string
  entryIds: string[]
  publishedEntryIds: string[]
  draftEntryIds: string[]
  // For cleanup (JWT-authed)
  adminToken: string
}

async function fetchJson(url: string, options: RequestInit = {}): Promise<{ status: number; body: any }> {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => null)
  return { status: response.status, body }
}

function uniqueName(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function setupTestContext(): Promise<TestContext> {
  if (!ADMIN_PASS) {
    throw new Error(
      'ADMIN_PASSWORD or ARCHITECT_TEST_PASSWORD env var required. ' +
      'Set it to match the Docker ADMIN_PASSWORD.'
    )
  }

  // 1. Login as admin
  const { body: loginBody } = await fetchJson(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  })
  if (!loginBody?.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginBody)}`)
  }
  const adminToken = loginBody.token
  const authHeaders = { Authorization: `Bearer ${adminToken}` }

  // 2. Create a dedicated test organization (not the default)
  const orgName = uniqueName('sdk_test_org')
  const { status: orgStatus, body: orgBody } = await fetchJson(`${BASE_URL}/api/organizations`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: orgName, plan: 'free', persistenceType: 'git' }),
  })
  if (orgStatus !== 201 && orgStatus !== 200) {
    throw new Error(`Failed to create org: ${orgStatus} ${JSON.stringify(orgBody)}`)
  }
  const organizationId = orgBody.data?.id || orgBody.id
  const scopedHeaders = { ...authHeaders, 'X-Organization': organizationId }

  // 3. Initialize default environments (dev/staging/prod with proper roles)
  await fetchJson(`${BASE_URL}/api/environments/initialize-defaults`, {
    method: 'POST',
    headers: scopedHeaders,
  })
  // Use 'development' environment (code_root role — allows model mutations)
  const environmentId = 'development'
  const fullScopedHeaders = { ...scopedHeaders, 'X-Environment': environmentId }

  // 4. Create a delivery API key for this org/env
  const { status: keyStatus, body: keyBody } = await fetchJson(`${BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: { ...fullScopedHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: uniqueName('sdk_test_key'), type: 'delivery' }),
  })
  if (keyStatus !== 201) {
    throw new Error(`Failed to create API key: ${keyStatus} ${JSON.stringify(keyBody)}`)
  }
  const apiKey = keyBody.fullKey

  // 4b. Create a preview API key for this org/env
  const { status: previewKeyStatus, body: previewKeyBody } = await fetchJson(`${BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: { ...fullScopedHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: uniqueName('sdk_preview_key'), type: 'preview' }),
  })
  if (previewKeyStatus !== 201) {
    throw new Error(`Failed to create preview API key: ${previewKeyStatus} ${JSON.stringify(previewKeyBody)}`)
  }
  const previewApiKey = previewKeyBody.fullKey

  // 4c. Create a management API key for this org/env
  const { status: mgmtKeyStatus, body: mgmtKeyBody } = await fetchJson(`${BASE_URL}/api/api-keys`, {
    method: 'POST',
    headers: { ...fullScopedHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: uniqueName('sdk_mgmt_key'), type: 'management' }),
  })
  if (mgmtKeyStatus !== 201) {
    throw new Error(`Failed to create management API key: ${mgmtKeyStatus} ${JSON.stringify(mgmtKeyBody)}`)
  }
  const managementApiKey = mgmtKeyBody.fullKey

  const managementClient = new ArchitectManagement({
    apiKey: managementApiKey,
    organizationId,
    environmentId,
    baseUrl: BASE_URL,
  })

  // 5. Seed test data: model with string, number, boolean fields
  const testModelName = uniqueName('sdk_test_model')
  const { status: modelStatus, body: modelBody } = await fetchJson(`${BASE_URL}/api/models`, {
    method: 'POST',
    headers: { ...fullScopedHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: testModelName,
      description: 'SDK integration test model',
      fields: [
        { name: 'title', displayName: 'Title', type: 'text', required: true },
        { name: 'category', displayName: 'Category', type: 'text' },
        { name: 'price', displayName: 'Price', type: 'number' },
        { name: 'featured', displayName: 'Featured', type: 'boolean' },
      ],
    }),
  })
  if (modelStatus !== 201) {
    throw new Error(`Failed to create model: ${modelStatus} ${JSON.stringify(modelBody)}`)
  }
  const testModelId = modelBody.id

  // 6. Seed entries with varied data
  const testEntries = [
    { title: 'Alpha Launch', category: 'tech', price: 100, featured: true },
    { title: 'Beta Release', category: 'science', price: 200, featured: false },
    { title: 'Gamma Update', category: 'tech', price: 300, featured: true },
    { title: 'Delta Launch', category: 'art', price: 50, featured: false },
  ]

  const entryIds: string[] = []
  for (const data of testEntries) {
    const { status: entryStatus, body: entryBody } = await fetchJson(`${BASE_URL}/api/entries`, {
      method: 'POST',
      headers: { ...fullScopedHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: testModelId, data }),
    })
    if (entryStatus !== 201) {
      throw new Error(`Failed to create entry: ${entryStatus} ${JSON.stringify(entryBody)}`)
    }
    entryIds.push(entryBody.id)
  }

  // 6b. Publish first two entries (leave last two as drafts)
  const publishedEntryIds: string[] = []
  const draftEntryIds: string[] = []
  for (let i = 0; i < entryIds.length; i++) {
    if (i < 2) {
      await fetchJson(`${BASE_URL}/api/entries/${entryIds[i]}/publish`, {
        method: 'POST',
        headers: { ...fullScopedHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      publishedEntryIds.push(entryIds[i])
    } else {
      draftEntryIds.push(entryIds[i])
    }
  }

  // 7. Create SDK client with the delivery API key
  const client = new ArchitectDelivery({
    apiKey,
    organizationId,
    environmentId,
    baseUrl: BASE_URL,
  })

  // 8. Create SDK client with the preview API key
  const previewClient = new ArchitectPreview({
    apiKey: previewApiKey,
    organizationId,
    environmentId,
    baseUrl: BASE_URL,
  })

  return {
    client,
    previewClient,
    managementClient,
    apiKey,
    previewApiKey,
    managementApiKey,
    organizationId,
    environmentId,
    baseUrl: BASE_URL,
    testModelId,
    testModelName,
    entryIds,
    publishedEntryIds,
    draftEntryIds,
    adminToken,
  }
}

export async function teardownTestContext(ctx: TestContext): Promise<void> {
  const headers = {
    Authorization: `Bearer ${ctx.adminToken}`,
    'X-Organization': ctx.organizationId,
    'X-Environment': ctx.environmentId,
  }

  // Delete entries
  for (const id of ctx.entryIds) {
    await fetch(`${ctx.baseUrl}/api/entries/${id}`, { method: 'DELETE', headers }).catch(() => {})
  }

  // Delete model
  await fetch(`${ctx.baseUrl}/api/models/${ctx.testModelId}`, { method: 'DELETE', headers }).catch(() => {})

  // Delete org (cascades environments, API keys, etc.)
  await fetch(`${ctx.baseUrl}/api/organizations/${ctx.organizationId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ctx.adminToken}` },
  }).catch(() => {})
}
