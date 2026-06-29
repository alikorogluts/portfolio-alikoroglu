import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "services/local-llm/.venv/**",
    "services/local-llm/**/__pycache__/**",
    "data/portfolio-assistant/*.jsonl",
    "data/portfolio-assistant/test_prompts.json",
    "next-env.d.ts",
  ]),
];

export default config;
