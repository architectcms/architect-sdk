import { describe, it, expect } from 'vitest'
import { resolveConfig } from '../src/config'

describe('resolveConfig', () => {
  it('defaults baseUrl to the hosted API', () => {
    const cfg = resolveConfig({ flags: {}, env: {}, file: {} })
    expect(cfg.baseUrl).toBe('https://api.architectcms.com')
  })
  it('prefers flags over env over file', () => {
    const cfg = resolveConfig({
      flags: { organizationId: 'org_flag' },
      env: { ARCHITECT_ORG: 'org_env', ARCHITECT_ENV: 'env_env' },
      file: { organizationId: 'org_file', environmentId: 'env_file' },
    })
    expect(cfg.organizationId).toBe('org_flag')
    expect(cfg.environmentId).toBe('env_env')
  })
})
