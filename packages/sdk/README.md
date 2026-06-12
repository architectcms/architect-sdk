# @architectcms/sdk

TypeScript SDK for [Architect CMS](https://github.com/your-org/architect) — delivery, preview, and management clients.

## Installation

```bash
npm install @architectcms/sdk
```

## Quick Start

```typescript
import { ArchitectDelivery } from '@architectcms/sdk';

const client = new ArchitectDelivery({
  apiKey: 'arch_delivery_...',
  organizationId: 'org_123',
  environmentId: 'env_prod',
  baseUrl: 'https://api.yoursite.com',
});

// Fetch entries
const posts = await client.entries.model('blog-post').fetch();

// Filter entries
const featured = await client.entries
  .model('blog-post')
  .where('category', 'technology')
  .where('featured', true)
  .limit(10)
  .fetch();

// Get a single entry
const post = await client.entries.get('entry_123');

// List models
const models = await client.models.list();

// Get asset image URL with transforms
const imageUrl = client.assets.imageUrl('asset_123', {
  width: 800,
  format: 'webp',
});
```

## Context-Aware Content

Architect supports context providers that deliver different content based on runtime parameters (loyalty tier, language, region, etc.). Pass context when fetching entries to get resolved content:

```typescript
// Fetch products with VIP pricing for French audience
const products = await client.entries
  .model('product')
  .withContext('loyalty_tier', 'vip')
  .withContext('language', 'fr')
  .fetch();

// Or pass multiple contexts at once
const products = await client.entries
  .model('product')
  .withContexts({ loyalty_tier: 'vip', language: 'fr' })
  .fetch();

// Context also works on single entry lookups
const product = await client.entries.get('entry_123', {
  loyalty_tier: 'vip',
  language: 'fr',
});
```

The API resolves context overrides server-side — the returned entry `data` contains the values for that specific context. No client-side resolution needed.

## Preview Mode

Use `ArchitectPreview` with a preview API key to access draft/unpublished entries:

```typescript
import { ArchitectPreview } from '@architectcms/sdk';

const preview = new ArchitectPreview({
  apiKey: 'arch_preview_...',    // preview key (not delivery)
  organizationId: 'org_123',
  environmentId: 'env_prod',
  baseUrl: 'https://api.yoursite.com',
});

// Returns ALL entries including unpublished drafts
const drafts = await preview.entries.model('blog-post').fetch();

// Context works in preview mode too
const localizedDraft = await preview.entries
  .model('blog-post')
  .withContext('language', 'fr')
  .fetch();
```

**Key type validation:** Each client only accepts its matching key prefix. Using the wrong key type throws a descriptive error.

| Client | Key Prefix | Reads | Writes | Sees Drafts |
|--------|-----------|-------|--------|-------------|
| `ArchitectDelivery` | `arch_delivery_` | Yes | No | No |
| `ArchitectPreview` | `arch_preview_` | Yes | No | Yes |
| `ArchitectManagement` | `arch_mgmt_` | Yes | Yes | Yes |

## Management Mode

Use `ArchitectManagement` with a management API key for full CRUD operations:

```typescript
import { ArchitectManagement } from '@architectcms/sdk';

const client = new ArchitectManagement({
  apiKey: 'arch_mgmt_...',
  organizationId: 'org_123',
  environmentId: 'env_prod',
  baseUrl: 'https://api.yoursite.com',
});

// Entries
const entry = await client.entries.create('blog-post', { title: 'Hello World' });
await client.entries.update(entry.id, { title: 'Updated' });
await client.entries.publish(entry.id);
await client.entries.delete(entry.id);

// Relationships
await client.entries.addRelation(entry.id, 'author', authorEntryId);
await client.entries.removeRelation(entry.id, 'author', authorEntryId);

// Models
const model = await client.models.create({ name: 'product', fields: [...] });
await client.models.addField(model.id, { name: 'price', type: 'number' });
await client.models.updateField(model.id, 'price', { required: true });
await client.models.deleteField(model.id, 'price');
await client.models.delete(model.id);

// Assets
const asset = await client.assets.upload(buffer, {
  filename: 'hero.jpg',
  mimeType: 'image/jpeg',
  title: 'Hero Image',
});
await client.assets.update(asset.id, { title: 'Updated', tags: ['hero'] });
await client.assets.delete(asset.id);

// Context Providers
const contexts = await client.contexts.list();
await client.contexts.create({ name: 'Region', sourceModelId: 'model_1' });
await client.contexts.update(ctx.id, { name: 'Updated' });
await client.contexts.delete(ctx.id);
```

## Website Preview Integration

To enable live preview from the Architect admin UI:

### 1. Configure the preview URL on your model

In the Architect admin UI, go to your model's settings tab and set the **Preview URL** template:

```
https://yoursite.com/blog/{slug}?preview=true
```

Use `{fieldName}` placeholders for entry data, `{id}` for entry ID.

### 2. Add a preview API route to your website

**Next.js example** (`app/api/preview/route.ts`):

```typescript
import { ArchitectPreview } from '@architectcms/sdk';

const preview = new ArchitectPreview({
  apiKey: process.env.ARCHITECT_PREVIEW_KEY!,
  organizationId: process.env.ARCHITECT_ORG_ID!,
  environmentId: process.env.ARCHITECT_ENV_ID!,
  baseUrl: process.env.ARCHITECT_API_URL!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entryId = searchParams.get('entryId');

  if (!entryId) {
    return new Response('Missing entryId', { status: 400 });
  }

  // Fetch draft entry with preview key
  const entry = await preview.entries.get(entryId);

  // Your rendering logic here
  return new Response(renderEntry(entry), {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

### 3. Preview from the admin UI

When editing an entry, click the **Preview** button in the top-right toolbar. The entry's website preview appears in a side panel alongside the editor, updating as you save changes.

## Type Generation

Generate TypeScript types from your CMS models:

```bash
npx @architectcms/sdk generate-types \
  --apiKey arch_delivery_... \
  --organizationId org_123 \
  --environmentId env_prod \
  --baseUrl https://api.yoursite.com \
  --output ./src/architect-types.ts
```

Then use with generics:

```typescript
import { BlogPost } from './architect-types';

const posts = await client.entries.model<BlogPost>('blog-post').fetch();
// posts[0].data.title -- fully typed
```

## Filter Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `eq` | `.where('status', 'active')` | Equals (default) |
| `ne` | `.where('status', 'ne', 'archived')` | Not equals |
| `gt` | `.where('price', 'gt', 100)` | Greater than |
| `gte` | `.where('price', 'gte', 100)` | Greater than or equal |
| `lt` | `.where('price', 'lt', 500)` | Less than |
| `lte` | `.where('price', 'lte', 500)` | Less than or equal |
| `in` | `.where('tag', 'in', ['a', 'b'])` | Value in array |
| `contains` | `.where('title', 'contains', 'launch')` | String contains (case-insensitive) |

## Performance

- **expandRelations**: Relations are expanded by default. Disable for faster queries:
  ```typescript
  const posts = await client.entries.model('blog-post').expandRelations(false).fetch();
  ```

## Requirements

- Node.js 18+ (uses native `fetch`)
- Architect CMS API key
