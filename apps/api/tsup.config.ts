import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  // Bundle the workspace package (TS source) into the output; keep real
  // npm dependencies external so they resolve from node_modules at runtime.
  noExternal: ['@changelog-studio/shared'],
});
