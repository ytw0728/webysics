const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
  extends: ["@webysics-monorepo/eslint-config"],
  parserOptions: {
    project: "./tsconfig.json",
  },
});
