import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next", "node_modules"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.recommended],
    rules: {
      // 🔧 Disable unused var warning
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  }
);
