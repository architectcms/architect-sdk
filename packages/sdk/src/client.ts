import { HttpClient } from './http'
import { EntriesResource } from './resources/entries'
import { ModelsResource } from './resources/models'
import { AssetsResource } from './resources/assets'
import type { ClientConfig } from './types/common'

export class ArchitectDelivery {
  public readonly entries: EntriesResource
  public readonly models: ModelsResource
  public readonly assets: AssetsResource

  constructor(config: ClientConfig & { _skipPrefixCheck?: boolean }) {
    if (!config.apiKey) throw new Error('apiKey is required')
    if (!config.organizationId) throw new Error('organizationId is required')
    if (!config.environmentId) throw new Error('environmentId is required')
    if (!config.baseUrl) throw new Error('baseUrl is required')
    if (!config._skipPrefixCheck && !config.apiKey.startsWith('arch_delivery_')) {
      throw new Error(
        'ArchitectDelivery requires a delivery API key (arch_delivery_...). ' +
        'For preview keys, use ArchitectPreview instead.'
      )
    }

    const http = new HttpClient(config)
    const baseUrl = config.baseUrl.replace(/\/$/, '')

    this.entries = new EntriesResource(http)
    this.models = new ModelsResource(http)
    this.assets = new AssetsResource(http, baseUrl)
  }
}
