import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      // import 순서: builtin → external(react 우선) → internal(@/) → parent/sibling
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: '@/**', group: 'internal', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // any 타입 금지
      '@typescript-eslint/no-explicit-any': 'error',

      // default export 지양 — export function 사용
      'import/no-default-export': 'error',
    },
  },

  // Next.js App Router 파일은 default export 필수
  {
    files: [
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/app/**/error.tsx',
      'src/app/**/global-error.tsx',
      'src/app/**/loading.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/template.tsx',
      'src/app/**/route.ts',
      'src/app/**/manifest.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },

  // 설정 파일은 default export 허용
  {
    files: [
      'next.config.ts',
      'postcss.config.mjs',
      'tailwind.config.ts',
      'eslint.config.mjs',
      'commitlint.config.mjs',
      'vitest.config.mts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },

  // Override default ignores of eslint-config-next.
  // public/**: 정적 에셋은 린트 대상 아님(.prettierignore와 동일 정책).
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**']),
]);

export default eslintConfig;
