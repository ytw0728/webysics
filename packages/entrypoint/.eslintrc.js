const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
    extends: ['../linters/eslint'],
    parserOptions: {
      project: './tsconfig.json'
    },
})