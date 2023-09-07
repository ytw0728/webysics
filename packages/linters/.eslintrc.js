const {defineConfig} = require('eslint-define-config')

/** for config file's lint */
module.exports = defineConfig({
  root: true,
  plugins: ['import'],
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
  ],
  env: {
    commonjs: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: '2015',
  },
  rules: {
    'require-jsdoc': 'off',
    'jsdoc/require-jsdoc': 'off',
    'semi': ['error', 'never', {beforeStatementContinuationChars: 'never'}],
    'array-bracket-newline': ['error', {multiline: true}],
    'max-len': ['error', {code: 120, comments: 120}],
    'eqeqeq': ['error', 'always'],
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        'alphabetize': {
          order: 'asc',
          orderImportKind: 'asc',
          caseInsensitive: true,
        },
      },
    ],
  },
})
