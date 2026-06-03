import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

// ESLint 9 flat config for the LowSplit React 18 + Vite (ESM) app.
// Fixes the long-standing "no eslint.config.js" issue that made `npm run lint`
// (and scripts/verify.sh) fail outright. Baseline ruleset: keep real bugs as
// errors, demote noisy legacy-code findings to warnings so lint stays useful
// without blocking. Tighten over time (see TODO.md Fase 1).
export default [
  {
    ignores: [
      'dist',
      'node_modules',
      'public',
      'supabase',
      'database',
      '**/*.config.js',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node, // covers netlify/functions (Node ESM)
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Legacy code carries many unused vars / shadowing; keep as warnings.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'no-empty': 'warn',
    },
  },
]
