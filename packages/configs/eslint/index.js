const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'prettier',
  ],
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    browser: true,
  },
  rules: {
    'require-jsdoc': 'off',
    'jsdoc/require-jsdoc': 'off',
    'array-bracket-newline': ['error', { multiline: true }],
    'brace-style': ['error', 'stroustrup'],
    'newline-per-chained-call': ['error'],
    'function-call-argument-newline': ['error', 'consistent'],
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/explicit-member-accessibility': [
      'warn',
      {
        overrides: {
          constructors: 'no-public',
        },
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/member-ordering': [
      'warn',
      {
        classes: {
          memberTypes: [
            'public-static-method',
            'public-decorated-method',
            'public-instance-method',
            'public-abstract-method',

            'protected-static-method',
            'protected-decorated-method',
            'protected-instance-method',
            'protected-abstract-method',

            'private-static-method',
            'private-decorated-method',
            'private-instance-method',

            'public-constructor',
            'protected-constructor',
            'private-constructor',

            'signature',

            'public-static-field',
            'public-decorated-field',
            'public-instance-field',
            'public-abstract-field',

            'protected-static-field',
            'protected-decorated-field',
            'protected-instance-field',
            'protected-abstract-field',

            'private-static-field',
            'private-decorated-field',
            'private-instance-field',
          ],
        },
      },
    ],
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
      {
        selector: ['accessor', 'typeLike'],
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-extra-semi': 'off',
    '@typescript-eslint/no-extraneous-class': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],
    '@typescript-eslint/no-redundant-type-constituents': 'off',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_+', ignoreRestSiblings: true }],
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-useless-constructor': 'warn',
    '@typescript-eslint/prefer-for-of': 'warn',
    '@typescript-eslint/prefer-includes': 'warn',
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    eqeqeq: ['error', 'always'],
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          orderImportKind: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],
    semi: [
      'error',
      'never',
      {
        beforeStatementContinuationChars: 'never',
      },
    ],
  },
})
