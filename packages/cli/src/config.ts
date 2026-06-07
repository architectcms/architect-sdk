export interface ResolvedConfig {
  apiKey?: string
  organizationId?: string
  environmentId?: string
  baseUrl: string
}

interface Sources {
  flags: Partial<Record<'apiKey' | 'organizationId' | 'environmentId' | 'baseUrl', string>>
  env: Record<string, string | undefined>
  file: Partial<ResolvedConfig>
}

const DEFAULT_BASE_URL = 'https://api.architectcms.com'

export function resolveConfig({ flags, env, file }: Sources): ResolvedConfig {
  const pick = (flag?: string, envVal?: string, fileVal?: string) => flag ?? envVal ?? fileVal
  return {
    apiKey: pick(flags.apiKey, env.ARCHITECT_API_KEY, file.apiKey),
    organizationId: pick(flags.organizationId, env.ARCHITECT_ORG, file.organizationId),
    environmentId: pick(flags.environmentId, env.ARCHITECT_ENV, file.environmentId),
    baseUrl: pick(flags.baseUrl, env.ARCHITECT_BASE_URL, file.baseUrl) ?? DEFAULT_BASE_URL,
  }
}
