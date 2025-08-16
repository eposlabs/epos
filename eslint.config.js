// @ts-check

import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.browser,
    },
  },
  rules: {
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-require-imports': 0,
    '@typescript-eslint/no-this-alias': 0,
    '@typescript-eslint/no-unused-expressions': 0,
    'no-async-promise-executor': 0,
    'no-setter-return': 0,
    'no-unused-labels': 0,
  },
})
