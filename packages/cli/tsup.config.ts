import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  target: 'node18',
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
})
