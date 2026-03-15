import { ArchitectDelivery } from './client'
import type { ClientConfig } from './types/common'

export class ArchitectPreview extends ArchitectDelivery {
  constructor(config: ClientConfig) {
    if (!config.apiKey) throw new Error('apiKey is required')
    if (!config.apiKey.startsWith('arch_preview_')) {
      throw new Error(
        'ArchitectPreview requires a preview API key (arch_preview_...). ' +
        'For delivery keys, use ArchitectDelivery instead.'
      )
    }
    super({ ...config, _skipPrefixCheck: true })
  }
}
