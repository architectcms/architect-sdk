import { describe, it, expect, beforeEach } from 'vitest'
import { mkdtempSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { saveCredentials, loadCredentials, clearCredentials, credentialsPath } from '../src/credentials'

let home: string
beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'arch-')); process.env.HOME = home })

describe('credentials', () => {
  it('round-trips and writes 0600', () => {
    saveCredentials({ apiKey: 'arch_mgmt_x', organizationId: 'org_1', environmentId: 'env_1', baseUrl: 'https://api.architectcms.com' })
    expect(loadCredentials()?.apiKey).toBe('arch_mgmt_x')
    expect(statSync(credentialsPath()).mode & 0o777).toBe(0o600)
  })
  it('clear removes credentials', () => {
    saveCredentials({ apiKey: 'k', organizationId: 'o', environmentId: 'e', baseUrl: 'b' })
    clearCredentials()
    expect(loadCredentials()).toBeNull()
  })
})
