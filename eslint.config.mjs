// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import globals from "globals";
import ts from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import jsdoc from "eslint-plugin-jsdoc";

const config = [
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  prettier,
  ...vue.configs["flat/recommended"],
  jsdoc.configs["flat/recommended"],

  {
    rules: {
      "prettier/prettier": "warn",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/no-parsing-error": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
    files: ["src/**/*", "packages/**/*"],
    plugins: {
      jsdoc,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: ts.parser,
      },
    },
  },

  {
    ignores: [
      ".github",
      ".next",
      ".turbo",
      ".vscode",
      "coverage",
      "dist",
      "dev-dist",
      "node_modules",
      "test/helpers/getWebGLStub.js",
      "src/presets",
    ],
  },
];

export default config;
