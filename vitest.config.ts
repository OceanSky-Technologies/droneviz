/// <reference types="vitest" />

import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    root: ".",
    include: ["tests/unit/**/*.test.ts"],
    exclude: ["*"],
    globals: true, // enable jest-like global test APIs

    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        domEnvironment: "happy-dom",
      },
    },
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      enabled: true,
      exclude: [
        "**/__tests__/**",
        "**/__x00__*",
        "**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}",
        "**/[.]**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
        "**/*.d.ts",
        "**/*{.,-}{test,spec,bench,benchmark}?(-d).?(c|m)[jt]s?(x)",
        "**/\x00*",
        "**/coverage/**",
        "**/cypress/**",
        "**/dev-dist/**",
        "**/dist/**",
        "**/forge.config.js",
        "**/node_modules/**",
        "**/packages/*/test?(s)/**",
        "**/postcss.config.js",
        "**/src-tauri/**",
        "**/tailwind.config.ts",
        "**/test?(-*).?(c|m)[jt]s?(x)",
        "**/test?(s)/**",
        "**/virtual:*",
        "**/vitest.{workspace,projects}.[jt]s?(on)",
        "**/tauri-app/**",
        "**/.tauri-build/**",
        "mavlink-ts/**/*",
        "postcss.config.cjs",
        "playwright.config.ts",
      ],
      thresholds: {
        lines: 75,
        functions: 80,
        branches: 60,
        statements: 70,
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      port: 5173,
    },
  },
  optimizeDeps: {},
});
