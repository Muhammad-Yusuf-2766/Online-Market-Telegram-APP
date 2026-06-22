/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "..",
  testMatch: ["<rootDir>/test/e2e/**/*.e2e-spec.ts"],
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ["<rootDir>/test/setup/e2e-env.ts"],
};
