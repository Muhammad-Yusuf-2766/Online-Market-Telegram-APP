const path = require("path");

/** @type {import('jest').Config} */
module.exports = {
  ...require("./apps/api/jest.config.js"),
  rootDir: path.join(__dirname, "apps/api/src"),
  coverageDirectory: path.join(__dirname, "apps/api/coverage"),
};
