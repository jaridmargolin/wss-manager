'use strict'

/* -----------------------------------------------------------------------------
 * eslint config
 * -------------------------------------------------------------------------- */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: 'standard',
  rules: {
    'quote-props': ['error', 'consistent-as-needed'],
    '@typescript-eslint/no-unused-vars': ['error']
  },
  overrides: [
    {
      files: ['**/*.test.ts'],
      env: { jest: true }
    }
  ]
}
