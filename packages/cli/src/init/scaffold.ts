import type { ArchitectManagement } from '@architectcms/sdk'
import type { InitConfig, LocalizationConfig, StarterModelInput } from './config-schema'
import { expandLocales } from './localization'

export interface LocalizationResult {
  modelId: string
  modelName: string
  providerName: string
  localesCreated: number
  hierarchy: boolean
}

export interface ScaffoldSummary {
  starterModels: string[]
  localization?: LocalizationResult
  bundles: string[]
}

/**
 * Create the localization context model, seed locale entries, and create the
 * context provider — all through the SDK. Returns a summary.
 *
 * Shapes verified against the architect server: context source models are marked
 * `isContextModel: true` with a `keyField`; the provider uses `derivationPath: []`
 * (identity via keyField) and `hierarchyRelations: ['parent']` for inheritance.
 */
export async function scaffoldLocalization(
  client: ArchitectManagement,
  config: LocalizationConfig,
): Promise<LocalizationResult> {
  const modelName = config.modelName ?? 'Locale'
  const providerName = config.providerName ?? 'Localization'
  const locales = expandLocales(config)

  // 1. Context model with `code` (key) + `name`.
  const model = await client.models.create({
    name: modelName,
    displayName: modelName,
    isContextModel: true,
    keyField: 'code',
    fields: [
      { name: 'code', type: 'text', required: true },
      { name: 'name', type: 'text', required: true },
    ],
  })

  // 2. Self-referencing `parent` relation for hierarchy (added after create —
  //    the model id doesn't exist until the model is created).
  if (config.hierarchy) {
    await client.models.addField(model.id, {
      name: 'parent',
      displayName: 'Parent',
      type: 'model',
      targetModelIds: [model.id],
      multiple: false,
    })
  }

  // 3. Seed locale entries parents-first, linking children to their parent entry.
  const idByCode = new Map<string, string>()
  for (const loc of locales) {
    const data: Record<string, unknown> = { code: loc.code, name: loc.name }
    if (config.hierarchy && loc.parent) {
      const parentId = idByCode.get(loc.parent)
      if (parentId) data.parent = parentId
    }
    const entry = await client.entries.create(model.id, data)
    idByCode.set(loc.code, entry.id)
  }

  // 4. Context provider. derivationPath [] = identity (use keyField `code`).
  await client.contexts.create({
    name: providerName,
    displayName: providerName,
    sourceModelId: model.id,
    derivationPath: [],
    hierarchyRelations: config.hierarchy ? ['parent'] : null,
  })

  return {
    modelId: model.id,
    modelName,
    providerName,
    localesCreated: locales.length,
    hierarchy: config.hierarchy,
  }
}

/** Create starter content models via the SDK. Returns the created model names. */
export async function scaffoldStarterModels(
  client: ArchitectManagement,
  models: StarterModelInput[],
): Promise<string[]> {
  const created: string[] = []
  for (const m of models) {
    await client.models.create({
      name: m.name,
      displayName: m.displayName,
      description: m.description,
      fields: m.fields as never,
      keyField: m.keyField,
      isContextModel: m.isContextModel,
    })
    created.push(m.name)
  }
  return created
}

/** Install marketplace bundles via the SDK. Returns the installed bundle ids. */
export async function installBundles(
  client: ArchitectManagement,
  bundleIds: string[],
): Promise<string[]> {
  const installed: string[] = []
  for (const id of bundleIds) {
    await client.bundles.install(id)
    installed.push(id)
  }
  return installed
}

/** Run the full scaffold (starter models → localization → bundles) from a config. */
export async function runScaffold(
  client: ArchitectManagement,
  config: InitConfig,
): Promise<ScaffoldSummary> {
  const summary: ScaffoldSummary = { starterModels: [], bundles: [] }

  if (config.starterModels?.length) {
    summary.starterModels = await scaffoldStarterModels(client, config.starterModels)
  }
  if (config.localization?.enabled) {
    summary.localization = await scaffoldLocalization(client, config.localization)
  }
  if (config.bundles?.length) {
    summary.bundles = await installBundles(client, config.bundles)
  }

  return summary
}
