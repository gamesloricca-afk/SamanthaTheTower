// Standalone lint config: this package must be lintable on its own after a fork,
// without the parent workspace.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  /*
   * `site/**` is the documentation site, which is a SvelteKit app with its own toolchain,
   * its own eslint config and its own rules — including default exports, which this config
   * forbids and every Svelte module requires. It is linted by `npm run lint` inside `site/`.
   */
  /*
   * `wasm/.build/**` is a 200k-line esbuild bundle of dist. Linting generated output reports
   * hundreds of problems about code nobody wrote and nobody can fix in place.
   */
  // `temp/` is gitignored local scratch: a clone never has it, so it is not the package's to lint.
  { ignores: ['dist/**', 'node_modules/**', 'src/**/*.generated.ts', 'site/**', 'temp/**', 'wasm/.build/**', 'wasm/.tools/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      // Named exports only — keeps re-exports and tooling predictable.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'Use a named export. This package is named-exports only.',
        },
      ],
      // The data tables are large literals; these add noise without value.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Unused *imports* are an error — they are always safe to delete and are
      // the usual residue of a refactor. Unused locals are a warning for now:
      // there are ~26 dead helpers left over from consolidating the calculator
      // engine, and removing a multi-line helper is a judgement call, not a
      // mechanical one. Clear them as you touch each file; do not bulk-delete.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-private-class-members': 'error',
      // Save data is genuinely `unknown` until it is read; that is the point.
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    // Build and check scripts run in Node, not the browser.
    files: ['scripts/**/*.mjs', 'mcp/**/*.mjs', 'wasm/*.mjs', 'examples/**/*.ts', '*.config.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', fetch: 'readonly' },
    },
    rules: { 'no-undef': 'off' },
  },
  {
    /*
     * The WASM entry runs inside Javy's QuickJS, not Node and not a browser.
     *
     * `Javy.IO` is how a Javy guest reaches stdio, and it exists only there — so no environment
     * ESLint knows about declares it.
     */
    files: ['wasm/entry.js'],
    languageOptions: {
      globals: { Javy: 'readonly', TextDecoder: 'readonly', TextEncoder: 'readonly' },
    },
    rules: { 'no-undef': 'off' },
  },
  {
    // Config files must default-export; that is their contract with the tool.
    files: ['*.config.ts', '*.config.mjs', '*.config.js'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
)
