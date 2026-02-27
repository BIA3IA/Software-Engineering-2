module.exports = {
  root: true,
  extends: ["expo"],
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "dist/",
  ],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
}
