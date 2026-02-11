module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-hooks", "react-refresh"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  settings: {
    react: { version: "detect" }
  },
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
  }
};
