import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'zod',
          message: "Import { z } from '@/lib/zod' so zod runs jitless (strict CSP, no eval).",
        }],
      }],
    },
  },
  {
    // The one place allowed to import zod directly.
    files: ['src/lib/zod.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
])
