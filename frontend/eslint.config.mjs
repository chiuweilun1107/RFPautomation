import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Third-party libraries
    "public/pdf.worker.min.js",
    "public/pdf.worker.min.mjs",
    "public/pdf.worker.*.js",
    "public/pdf.worker.*.mjs",
    // Test coverage
    "coverage/**",
    // Test and utility scripts
    "**/*.test.js",
    "**/*.test.ts",
    "**/*.test.tsx",
    "test_*.js",
    "check_*.js",
    "apply_migration.js",
    "verify_final.js",
    "debug_criteria.ts",
    // Configuration files
    "jest.config.js",
    "empty-module.js",
  ]),
  // Custom rules
  {
    rules: {
      'no-console': ['warn', {
        allow: ['error', 'warn']
      }]
    }
  },
  // Relaxed rules for API routes (Next.js dynamic types)
  {
    files: ['src/app/api/**/*.ts', 'src/app/api/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Downgrade from error to warning for API routes
    }
  },
  // Relaxed rules for scripts
  {
    files: ['scripts/**/*.ts', 'scripts/**/*.mjs'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off'
    }
  }
]);

export default eslintConfig;
