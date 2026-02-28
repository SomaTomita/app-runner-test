import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/coverage/",
      "backend/src/generated/",
      "backend/prisma/migrations/",
    ],
  },

  // Base: JS recommended
  eslint.configs.recommended,

  // TypeScript recommended (all .ts/.tsx)
  ...tseslint.configs.recommended,

  // Allow underscore-prefixed unused vars (standard convention)
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },

  // Test files: relax no-explicit-any (mocks often need it)
  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Frontend: React Hooks
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    ...reactHooks.configs["recommended-latest"],
  },

  // Frontend: React Refresh (Vite preset — allows constant exports)
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    ...reactRefresh.configs.vite(),
  },

  // Prettier: must be last
  eslintConfigPrettier,
);
