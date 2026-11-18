import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Konfiguration und E2E-Tests laufen in Node, nicht im Browser.
    files: ['playwright.config.js', 'e2e/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Provider und Hook liegen bewusst in einer Datei; die Regel betrifft nur Fast Refresh im Dev-Server.
    files: ['src/contexts/AuthContext.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
