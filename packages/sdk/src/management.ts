import { HttpClient } from './http'
import { ManagementEntriesResource } from './resources/management-entries'
import { ManagementModelsResource } from './resources/management-models'
import { ManagementAssetsResource } from './resources/management-assets'
import { ContextsResource } from './resources/contexts'
import { BundlesResource } from './resources/bundles'
import { EnvironmentsResource } from './resources/environments'
import { ArchitectDelivery } from './client'
import type { ClientConfig } from './types/common'

export class ArchitectManagement extends ArchitectDelivery {
  public override readonly entries: ManagementEntriesResource
  public override readonly models: ManagementModelsResource
  public override readonly assets: ManagementAssetsResource
  public readonly contexts: ContextsResource
  public readonly bundles: BundlesResource
  public readonly environments: EnvironmentsResource

  constructor(config: ClientConfig) {
    if (!config.apiKey) throw new Error('apiKey is required')
    if (!config.apiKey.startsWith('arch_mgmt_')) {
      throw new Error(
        'ArchitectManagement requires a management API key (arch_mgmt_...). ' +
        'For delivery keys, use ArchitectDelivery instead.'
      )
    }
    super({ ...config, _skipPrefixCheck: true })

    const http = new HttpClient(config)
    const baseUrl = config.baseUrl.replace(/\/$/, '')

    this.entries = new ManagementEntriesResource(http)
    this.models = new ManagementModelsResource(http)
    this.assets = new ManagementAssetsResource(http, baseUrl)
    this.contexts = new ContextsResource(http)
    this.bundles = new BundlesResource(http)
    this.environments = new EnvironmentsResource(http)
  }
}
