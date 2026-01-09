import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // DeFi-specific rules for enhanced code quality
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "@typescript-eslint/explicit-function-return-type": ["warn", {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true
      }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      
      // React/Next.js specific rules for DeFi components
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-no-leaked-render": "error",
      "react/no-array-index-key": "warn",
      "react/jsx-key": "error",
      
      // DeFi security and best practices
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "no-debugger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      
      // Import organization for feature-based architecture
      "import/order": ["error", {
        "groups": [
          "builtin",
          "external", 
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "pathGroups": [
          {
            "pattern": "@/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/features/**",
            "group": "internal",
            "position": "before"
          },
          {
            "pattern": "@/shared/**",
            "group": "internal",
            "position": "before"
          }
        ],
        "pathGroupsExcludedImportTypes": ["builtin"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }],
      
      // Naming conventions for DeFi development
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "interface",
          "format": ["PascalCase"],
          "prefix": ["I"]
        },
        {
          "selector": "typeAlias",
          "format": ["PascalCase"]
        },
        {
          "selector": "enum",
          "format": ["PascalCase"]
        },
        {
          "selector": "variable",
          "modifiers": ["const", "global"],
          "format": ["UPPER_CASE", "camelCase", "PascalCase"]
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional ignores for DeFi project
    "src/gen/**",
    "**/*.config.js",
    "**/*.config.ts",
    "scripts/**",
    "playwright-report/**",
    "test-results/**"
  ]),
]);

export default eslintConfig;
