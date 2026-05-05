/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.app.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  settings: {
    react: { version: '18.3' },
    'import/resolver': {
      typescript: { project: ['./tsconfig.app.json', './tsconfig.node.json'] },
    },
    'boundaries/elements': [
      { type: 'app', pattern: 'src/app/**' },
      { type: 'features', pattern: 'src/features/*', mode: 'folder' },
      { type: 'shared', pattern: 'src/shared/**' },
      { type: 'tcg', pattern: 'src/tcg/*', mode: 'folder' },
    ],
    'boundaries/ignore': ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'react-refresh',
    'boundaries',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:boundaries/recommended',
  ],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/features/*/*', '!@/features/*/index'],
            message: 'Importez une feature uniquement via son barrel index.ts (pas en profondeur).',
          },
        ],
      },
    ],
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          { from: 'app', allow: ['app', 'features', 'shared', 'tcg'] },
          { from: 'features', allow: ['features', 'shared', 'tcg'] },
          { from: 'shared', allow: ['shared'] },
          { from: 'tcg', allow: ['shared'] },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['vite.config.ts', 'vitest.config.ts', 'playwright.config.ts', 'tailwind.config.ts'],
      rules: {
        'no-restricted-imports': 'off',
        'boundaries/element-types': 'off',
      },
    },
    {
      files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'boundaries/element-types': 'off',
      },
    },
    {
      // Design system and feature folders co-locate variant helpers, hooks,
      // and contexts with components. Fast Refresh granularity is sacrificed
      // for ergonomics.
      files: ['src/shared/ui/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      files: ['e2e/**/*.ts'],
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      parserOptions: { project: null },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'boundaries/element-types': 'off',
      },
    },
  ],
  ignorePatterns: ['dist', 'node_modules', 'coverage', 'playwright-report', '.eslintrc.cjs'],
};
