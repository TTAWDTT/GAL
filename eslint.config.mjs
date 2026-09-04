import nextConfig from "eslint-config-next/core-web-vitals";

const config = [
  ...nextConfig,
  {
    ignores: [".next/**", "out/**", "node_modules/**", ".playwright-cli/**"],
  },
];

export default config;
