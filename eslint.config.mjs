import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Cube notation uses apostrophes constantly (R', U', F') — escaping
      // them as &apos; in JSX text would make the notation content unreadable.
      "react/no-unescaped-entities": "off",
      // Our fetch-on-mount effects only call setState after awaiting
      // Firestore, which this rule cannot distinguish from synchronous
      // setState. The scramble effect must run client-side to avoid a
      // hydration mismatch from Math.random().
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default config
