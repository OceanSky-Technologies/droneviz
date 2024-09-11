import eslint from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";

const config = [
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  prettier,
  ...vue.configs["flat/recommended"],
  jsdoc.configs["flat/recommended-error"],

  {
    files: ["src/**/*", "packages/**/*", "test/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        parser: tseslint.parser,
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
      "prettier/prettier": "error",
      "sort-imports": "off",
      "sort-keys": "off",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/no-parsing-error": "off",
      "vue/singleline-html-element-content-newline": "off",
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
      "presets",
      "mavlink-ts",
    ],
  },
];

export default config;
