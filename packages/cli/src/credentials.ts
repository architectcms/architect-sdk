import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface StoredCredentials {
  apiKey: string
  organizationId: string
  environmentId: string
  baseUrl: string
}

export const credentialsDir = () => join(homedir(), '.architect')
export const credentialsPath = () => join(credentialsDir(), 'credentials.json')

export function saveCredentials(c: StoredCredentials): void {
  mkdirSync(credentialsDir(), { recursive: true, mode: 0o700 })
  writeFileSync(credentialsPath(), JSON.stringify(c, null, 2), { mode: 0o600 })
}

export function loadCredentials(): StoredCredentials | null {
  if (!existsSync(credentialsPath())) return null
  try {
    return JSON.parse(readFileSync(credentialsPath(), 'utf-8')) as StoredCredentials
  } catch {
    return null
  }
}

export function clearCredentials(): void {
  if (existsSync(credentialsPath())) rmSync(credentialsPath())
}
