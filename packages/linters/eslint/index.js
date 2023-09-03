const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'google',
    ],
    extends: 'google',
    parserOptions: {
        sourceType: 'module',
    },
    rules: {
        'require-jsdoc': 'off',
        "jsdoc/require-jsdoc": 'off',
        semi: ['error', 'never', { beforeStatementContinuationChars: "never" }]
    },
});