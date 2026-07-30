import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next 15 ships legacy (eslintrc-format) configs only;
// FlatCompat bridges them into ESLint 9 flat config.
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "prisma/migrations/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Ensures ESLint also discovers TypeScript files (legacy configs carry no `files`)
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Lenient on purpose: the goal is a working lint gate, not a strict one.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
    },
  },
];
