const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const reactHooks = require("eslint-plugin-react-hooks");
const globals = require("globals");

const typescriptFiles = ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"];
const reactFiles = ["apps/*/src/**/*.{ts,tsx}", "packages/ui/src/**/*.{ts,tsx}"];

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/dist-server/**",
      "**/generated/**",
      "**/.turbo/**",
      "**/.vercel/**",
      ".agents/**",
      ".codex/**",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,cjs,mjs}", ...typescriptFiles],
    languageOptions: { ecmaVersion: "latest" },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: { globals: globals.node },
    rules: { "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] },
  },
  {
    files: typescriptFiles,
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: reactFiles,
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["apps/mcp_app/**/*.ts", "apps/*/vite.config.ts", "packages/utils/**/*.ts"],
    ignores: ["apps/mcp_app/src/**"],
    languageOptions: { globals: globals.node },
  },
];
