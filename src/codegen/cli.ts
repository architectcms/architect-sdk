import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ArchitectDelivery } from '../client'
import { generateTypes } from './generator'

interface CliArgs {
  apiKey: string
  organizationId: string
  environmentId: string
  baseUrl: string
  output: string
}

function parseArgs(argv: string[]): CliArgs {
  const args: Record<string, string> = {}

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const arg = argv[i].slice(2)
      // Support both --key value and --key=value
      const eqIndex = arg.indexOf('=')
      if (eqIndex !== -1) {
        args[arg.slice(0, eqIndex)] = arg.slice(eqIndex + 1)
      } else {
        const value = argv[i + 1]
        if (value && !value.startsWith('--')) {
          args[arg] = value
          i++
        }
      }
    }
  }

  const required = ['apiKey', 'organizationId', 'environmentId', 'baseUrl', 'output']
  for (const key of required) {
    if (!args[key]) {
      console.error(`Missing required argument: --${key}`)
      console.error('')
      console.error('Usage:')
      console.error('  architect-sdk generate-types \\')
      console.error('    --apiKey arch_delivery_... \\')
      console.error('    --organizationId org_123 \\')
      console.error('    --environmentId env_prod \\')
      console.error('    --baseUrl https://api.yoursite.com \\')
      console.error('    --output ./src/architect-types.ts')
      process.exit(1)
    }
  }

  return args as unknown as CliArgs
}

async function main() {
  const argv = process.argv.slice(2)

  // Skip the "generate-types" subcommand if present
  const commandArgs = argv[0] === 'generate-types' ? argv.slice(1) : argv

  const args = parseArgs(commandArgs)

  console.log('Fetching models...')

  const client = new ArchitectDelivery({
    apiKey: args.apiKey,
    organizationId: args.organizationId,
    environmentId: args.environmentId,
    baseUrl: args.baseUrl,
  })

  const models = await client.models.list()
  console.log(`Found ${models.length} models`)

  const output = generateTypes(models)
  const outputPath = resolve(process.cwd(), args.output)
  writeFileSync(outputPath, output, 'utf-8')

  console.log(`Types written to ${outputPath}`)
}

main().catch(error => {
  console.error('Error:', error.message)
  process.exit(1)
})
