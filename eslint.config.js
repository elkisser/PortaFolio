import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

// ESLint flat config para la fundación Astro (tarea 1).
// Ignora el sitio vanilla heredado (strangler pattern): js/, styles/, etc.
export default [
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      // Sitio vanilla heredado (se migra en tareas posteriores, no se lintea aquí).
      'js/**',
      'index.html',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    // env.d.ts usa el patrón idiomático de Astro (triple-slash reference).
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    // En archivos tipados (TS y frontmatter .astro) TypeScript ya verifica los
    // identificadores; la regla base `no-undef` da falsos positivos con tipos
    // globales del DOM (p. ej. HTMLElementTagNameMap). typescript-eslint
    // recomienda desactivarla. https://typescript-eslint.io/troubleshooting/faqs/eslint/
    files: ['**/*.ts', '**/*.astro'],
    rules: {
      'no-undef': 'off',
    },
  },
];
