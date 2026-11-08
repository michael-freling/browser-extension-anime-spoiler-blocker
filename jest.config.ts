import type { Config } from "jest";

// https://github.com/PlasmoHQ/examples/blob/main/with-jest/jest.config.mjs
const config: Config = {
  verbose: true,
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^~(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    // Helpers for tests
    "!src/test/**",
  ],
  coverageReporters: ["text", "lcov"],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
  },
};

export default config;
