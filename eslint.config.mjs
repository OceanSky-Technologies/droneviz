// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import globals from "globals";
import ts from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
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
      "node_modules",
      "**/test/helpers/getWebGLStub.js",
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...vue.configs["flat/essential"],
  {
    files: ["*.vue", "**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },

  // prettier
  prettier,
  {
    rules: {
      "prettier/prettier": "warn",
    },
  },
];
