// Flat ESLint config (ESLint 10 + typescript-eslint 8). Lints the generator's own source.
// Prettier owns formatting; `eslint-config-prettier` disables any stylistic rule that would conflict.
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  {
    // Generated output, vendored upstream text and template/skill markdown are not ours to lint.
    ignores: ["dist/**", "vendor/**", "templates/**", "skill-packs/**", "coverage/**"],
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/**/*.ts"],
    rules: {
      // Mirror AGENTS.md Layer 1: no `any` at boundaries — use `unknown` and narrow.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // The test suite runs against the built `dist/` and uses Node's runner; keep it lint-light.
    files: ["test/**/*.js"],
    ...tseslint.configs.disableTypeChecked,
    rules: {},
  },
);
