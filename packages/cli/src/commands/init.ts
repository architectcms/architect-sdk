import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { confirm, input, select } from '@inquirer/prompts'
import { getManagementClient } from '../client'
import { printError } from '../output'
import { runScaffold } from '../init/scaffold'
import { validateLocalization } from '../init/localization'
import type { InitConfig, LocaleInput, LocalizationConfig } from '../init/config-schema'

function loadConfigFile(path: string): InitConfig {
  let raw: string
  try {
    raw = readFileSync(path, 'utf-8')
  } catch {
    throw new Error(`Could not read config file: ${path}`)
  }
  try {
    return JSON.parse(raw) as InitConfig
  } catch {
    throw new Error(`Config file is not valid JSON: ${path}`)
  }
}

/** Interactive localization wizard → LocalizationConfig. */
async function promptLocalization(): Promise<LocalizationConfig | undefined> {
  const enabled = await confirm({ message: 'Set up localization?', default: true })
  if (!enabled) return undefined

  const locales: LocaleInput[] = []
  let addMore = true
  while (addMore) {
    const code = await input({
      message: 'Locale code (e.g. en-US, fr-FR):',
      validate: v => (v.trim() ? true : 'Code is required'),
    })
    const name = await input({
      message: `Display name for ${code} (e.g. "English (US)"):`,
      default: code,
    })
    locales.push({ code: code.trim(), name: name.trim() })
    addMore = await confirm({ message: 'Add another locale?', default: false })
  }

  const defaultLocale = await select({
    message: 'Default / fallback locale:',
    choices: locales.map(l => ({ name: `${l.code} — ${l.name}`, value: l.code })),
  })

  const hierarchy = await confirm({
    message: 'Model a language→region hierarchy (fr-FR falls back to fr)?',
    default: true,
  })

  return { enabled: true, locales, defaultLocale, hierarchy }
}

/** Build an InitConfig interactively. */
async function promptInitConfig(): Promise<InitConfig> {
  const localization = await promptLocalization()
  return { localization }
}

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Bootstrap a workspace: scaffold models, localization, and bundles')
    .option('--config <file>', 'Run non-interactively from a JSON config file')
    .option('--yes', 'Never prompt; fail if anything required is missing (CI mode)')
    .action(async (opts) => {
      try {
        let config: InitConfig
        if (opts.config) {
          config = loadConfigFile(opts.config)
        } else if (opts.yes) {
          throw new Error('--yes requires --config <file> (nothing to do without prompts or a config).')
        } else {
          config = await promptInitConfig()
        }

        // Validate before touching the API.
        if (config.localization?.enabled) {
          const problems = validateLocalization(config.localization)
          if (problems.length > 0) {
            throw new Error(`Invalid localization config:\n  - ${problems.join('\n  - ')}`)
          }
        }

        // The CLI scaffolds through an authenticated management client. New-user
        // org creation happens during the login flow (`architect login`).
        const client = getManagementClient()

        const summary = await runScaffold(client, config)

        console.log('✓ Init complete.')
        if (summary.starterModels.length) {
          console.log(`  Models:       ${summary.starterModels.join(', ')}`)
        }
        if (summary.localization) {
          const l = summary.localization
          console.log(
            `  Localization: model "${l.modelName}" (${l.localesCreated} locale(s))` +
            `, provider "${l.providerName}"${l.hierarchy ? ', hierarchical' : ''}`,
          )
        }
        if (summary.bundles.length) {
          console.log(`  Bundles:      ${summary.bundles.join(', ')}`)
        }
        if (!summary.starterModels.length && !summary.localization && !summary.bundles.length) {
          console.log('  Nothing to scaffold (empty config).')
        }
      } catch (err) {
        printError(err)
        process.exitCode = 1
      }
    })
}
