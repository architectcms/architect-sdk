import { Command } from 'commander'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateTypes } from '@architectcms/sdk'
import { getManagementClient } from '../client'
import { printError } from '../output'

export function registerTypes(program: Command): void {
  const types = program.command('types').description('Generate code from your content models')

  types
    .command('generate')
    .description('Generate TypeScript types for your models')
    .option('--output <file>', 'Output file path', './architect-types.ts')
    .action(async (opts) => {
      try {
        const client = getManagementClient()
        const models = await client.models.list()
        const output = generateTypes(models)
        const outputPath = resolve(process.cwd(), opts.output)
        writeFileSync(outputPath, output, 'utf-8')
        console.log(`✓ Generated types for ${models.length} model(s) → ${outputPath}`)
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
