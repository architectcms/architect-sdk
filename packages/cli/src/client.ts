import { ArchitectManagement } from '@architect-cms/sdk'
import { loadCredentials } from './credentials'

export function getManagementClient(): ArchitectManagement {
  const c = loadCredentials()
  if (!c?.apiKey) {
    throw new Error('Not logged in. Run `architect login` first.')
  }
  return new ArchitectManagement({
    apiKey: c.apiKey,
    organizationId: c.organizationId,
    environmentId: c.environmentId,
    baseUrl: c.baseUrl,
  })
}
