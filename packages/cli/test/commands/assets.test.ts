import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runAssetsUpload } from '../../src/commands/assets'

function fakeClient() {
  return {
    assets: {
      upload: vi.fn().mockResolvedValue({ id: 'asset_1' }),
      update: vi.fn().mockResolvedValue({ id: 'asset_1' }),
    },
  } as any
}

let dir: string
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'arch-assets-')) })

describe('assets upload', () => {
  it('uploads a file with a detected mime type and returns its id', async () => {
    const client = fakeClient()
    const file = join(dir, 'logo.png')
    writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]))
    const result = await runAssetsUpload(client, file, {})
    expect(client.assets.upload).toHaveBeenCalledOnce()
    const [bytes, options] = client.assets.upload.mock.calls[0]
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(options).toMatchObject({ filename: 'logo.png', mimeType: 'image/png' })
    expect(result).toEqual({ id: 'asset_1', filename: 'logo.png' })
  })

  it('parses comma-separated tags', async () => {
    const client = fakeClient()
    const file = join(dir, 'a.jpg')
    writeFileSync(file, 'x')
    await runAssetsUpload(client, file, { tags: 'hero, marketing ,2026' })
    expect(client.assets.upload.mock.calls[0][1].tags).toEqual(['hero', 'marketing', '2026'])
  })

  it('applies alt text via a follow-up update', async () => {
    const client = fakeClient()
    const file = join(dir, 'a.webp')
    writeFileSync(file, 'x')
    await runAssetsUpload(client, file, { alt: 'A logo' })
    expect(client.assets.update).toHaveBeenCalledWith('asset_1', { alt: 'A logo' })
  })

  it('does not call update when no alt is given', async () => {
    const client = fakeClient()
    const file = join(dir, 'a.gif')
    writeFileSync(file, 'x')
    await runAssetsUpload(client, file, {})
    expect(client.assets.update).not.toHaveBeenCalled()
  })
})
