import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";

import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    files: ["**/*.ts", "**/*.js", "**/*.vue"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      "capitalized-comments": "off",
      "func-style": "off",
      "id-length": "off",
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      "max-classes-per-file": "off",
      "max-lines-per-function": "off",
      "max-params": "off",
      "max-statements": "off",
      "no-console": "off",
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-ternary": "off",
      "no-undefined": "off",
      "no-use-before-define": "off",
      "one-var": "off",
      "prefer-template": "off",
      "sort-imports": "off",
      "sort-keys": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/no-parsing-error": "off",
      "vue/singleline-html-element-content-newline": "off",
    },
  },
  {
    ignores: [
      ".github",
      ".nuxt",
      ".tauri-build",
      ".vscode",
      "coverage",
      "dev-dist",
      "dist",
      "mavlink-ts",
      "node_modules",
      "src-tauri",
      "tauri-app",
      "test",
    ],
  },
);
