/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: { node: true, es2022: true },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended-type-checked'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['tests/**/*.ts', '**/*.test.ts'],
      parserOptions: { project: null },
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      rules: { '@typescript-eslint/no-explicit-any': 'off' },
    },
    {
      // CLI scripts are allowed to print to stdout.
      files: ['src/db/migrate.ts'],
      rules: { 'no-console': 'off' },
    },
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.cjs',
    'vitest.config.ts',
    'drizzle.config.ts',
    'drizzle/**',
  ],
};
