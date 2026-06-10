// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import vitest from '@vitest/eslint-plugin';
import customRules from './eslint-rules/index.cjs';

export default tseslint.config(
  {
    ignores: [
      'build',
      'dist',
      'public',
      'src/api',
      'src/routeTree.gen.ts',
      'node_modules',
      'coverage',
      'eslint_report.json',
      'eslint-rules',
      'storybook-static',
    ],
  },
  // Custom color theming rules: app code may only use the semantic tokens
  // defined in src/index.css.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      forky: customRules,
    },
    rules: {
      'forky/no-hardcoded-colors': 'error',
      'forky/no-primitive-color-scales': 'error',
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, vitest.configs.recommended, prettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2025,
        ...globals.jest,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React Compiler readiness rules (react-hooks v7). The codebase is
      // clean; keep them as errors so regressions fail lint.
      'react-hooks/purity': 'error',
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/immutability': 'error',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
          proseWrap: 'never',
        },
      ],
      // The codebase intentionally parses base-10 decimal strings (slots,
      // epochs) without an explicit radix.
      radix: 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  storybook.configs['flat/recommended'],
  {
    files: ['**/.storybook/**/*.{js,ts}'],
    rules: {
      'storybook/no-uninstalled-addons': [
        'error',
        {
          packageJsonLocation: './package.json',
          ignore: ['storybook/viewport'],
        },
      ],
    },
  }
);
