import { describe, test, expect } from 'vitest'
import { generateTypes } from '../src/codegen/generator'
import type { Model } from '../src/types/model'

describe('generateTypes', () => {
  test('generates interface for simple model', () => {
    const models: Model[] = [{
      id: 'model_1',
      name: 'blog-post',
      displayName: 'Blog Post',
      fields: [
        { name: 'title', type: 'string', required: true },
        { name: 'body', type: 'richtext' },
        { name: 'views', type: 'number' },
        { name: 'published', type: 'boolean' },
        { name: 'publishDate', type: 'date' },
      ],
    }]

    const output = generateTypes(models)

    expect(output).toContain('export interface BlogPost')
    expect(output).toContain('title: string')
    expect(output).toContain('body?: string')
    expect(output).toContain('views?: number')
    expect(output).toContain('published?: boolean')
    expect(output).toContain('publishDate?: string')
    expect(output).toContain('auto-generated')
  })

  test('marks required fields without ?', () => {
    const models: Model[] = [{
      id: 'model_1',
      name: 'product',
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'price', type: 'number', required: true },
        { name: 'description', type: 'string' },
      ],
    }]

    const output = generateTypes(models)

    expect(output).toContain('name: string')
    expect(output).toContain('price: number')
    expect(output).toContain('description?: string')
  })

  test('resolves single relation to target interface', () => {
    const models: Model[] = [
      {
        id: 'model_author',
        name: 'author',
        fields: [{ name: 'name', type: 'string', required: true }],
      },
      {
        id: 'model_post',
        name: 'blog-post',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'author', type: 'relation', targetModelId: 'model_author', required: true },
        ],
      },
    ]

    const output = generateTypes(models)

    expect(output).toContain('author: Author')
    expect(output).not.toContain('author: string')
  })

  test('resolves multiple relation to target array', () => {
    const models: Model[] = [
      {
        id: 'model_category',
        name: 'category',
        fields: [{ name: 'name', type: 'string', required: true }],
      },
      {
        id: 'model_post',
        name: 'blog-post',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'categories', type: 'relation', targetModelId: 'model_category', multiple: true },
        ],
      },
    ]

    const output = generateTypes(models)

    expect(output).toContain('categories?: Category[]')
  })

  test('generates nested interface for group fields', () => {
    const models: Model[] = [{
      id: 'model_1',
      name: 'product',
      fields: [
        { name: 'name', type: 'string', required: true },
        {
          name: 'dimensions',
          type: 'group',
          fields: [
            { name: 'width', type: 'number', required: true },
            { name: 'height', type: 'number', required: true },
            { name: 'depth', type: 'number' },
          ],
        },
      ],
    }]

    const output = generateTypes(models)

    expect(output).toContain('export interface ProductDimensions')
    expect(output).toContain('width: number')
    expect(output).toContain('height: number')
    expect(output).toContain('depth?: number')
    expect(output).toContain('dimensions?: ProductDimensions')
  })

  test('handles circular relations', () => {
    const models: Model[] = [{
      id: 'model_person',
      name: 'person',
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'manager', type: 'relation', targetModelId: 'model_person' },
      ],
    }]

    const output = generateTypes(models)

    expect(output).toContain('manager?: Person')
  })

  test('converts kebab-case model names to PascalCase', () => {
    const models: Model[] = [{
      id: 'model_1',
      name: 'blog-post-category',
      fields: [{ name: 'name', type: 'string', required: true }],
    }]

    const output = generateTypes(models)

    expect(output).toContain('export interface BlogPostCategory')
  })

  test('converts snake_case model names to PascalCase', () => {
    const models: Model[] = [{
      id: 'model_1',
      name: 'blog_post',
      fields: [{ name: 'name', type: 'string', required: true }],
    }]

    const output = generateTypes(models)

    expect(output).toContain('export interface BlogPost')
  })

  test('handles model with no fields', () => {
    const models: Model[] = [{
      id: 'model_1',
      name: 'empty',
      fields: [],
    }]

    const output = generateTypes(models)

    expect(output).toContain('export interface Empty')
  })

  test('falls back to string for unknown relation target', () => {
    const models: Model[] = [{
      id: 'model_1',
      name: 'post',
      fields: [
        { name: 'author', type: 'relation', targetModelId: 'model_nonexistent' },
      ],
    }]

    const output = generateTypes(models)

    expect(output).toContain('author?: string')
  })
})
