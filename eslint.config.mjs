import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // TypeScript 관련 규칙
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // React 관련 규칙 (성능 최적화)
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "error", // warn → error (deps 누락은 버그 유발)

      // Next.js 관련 규칙
      "@next/next/no-img-element": "warn", // next/image 사용 강제

      // 일반 규칙
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
