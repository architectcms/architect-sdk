import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { basename, extname } from 'node:path'
import type { ArchitectManagement } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printResult, printError } from '../output'

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
}

export interface AssetUploadOptions {
  title?: string
  description?: string
  tags?: string
  alt?: string
  mimeType?: string
}

export async function runAssetsUpload(
  client: ArchitectManagement,
  file: string,
  opts: AssetUploadOptions,
): Promise<{ id: string; filename: string }> {
  const bytes = new Uint8Array(readFileSync(file))
  const filename = basename(file)
  const ext = extname(file).toLowerCase()
  const mimeType = opts.mimeType ?? MIME_TYPES[ext] ?? 'application/octet-stream'
  const tags = opts.tags
    ? opts.tags.split(',').map(t => t.trim()).filter(Boolean)
    : undefined

  const asset = await client.assets.upload(bytes, {
    filename,
    mimeType,
    title: opts.title,
    description: opts.description,
    tags,
  })

  if (opts.alt) {
    await client.assets.update(asset.id, { alt: opts.alt })
  }

  return { id: asset.id, filename }
}

export function registerAssets(program: Command): void {
  const assets = program.command('assets').description('Manage media assets')
  assets
    .command('upload <file>')
    .description('Upload a file as an asset and print its id')
    .option('--title <title>', 'Asset title')
    .option('--description <description>', 'Asset description')
    .option('--tags <tags>', 'Comma-separated tags')
    .option('--alt <alt>', 'Alt text (applied via a follow-up metadata update)')
    .option('--mime-type <mimeType>', 'Override the detected MIME type')
    .action(async (file: string, opts: AssetUploadOptions) => {
      try {
        const result = await runAssetsUpload(getManagementClient(), file, opts)
        printResult(result, program.opts().json ?? false, ['id', 'filename'])
      } catch (err) {
        printError(err)
        process.exit(1)
      }
    })
}
