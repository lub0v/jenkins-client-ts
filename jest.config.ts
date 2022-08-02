// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

export default {
  testMatch: ['**/?(*.)+(spec|test|e2e|int|integration).[tj]s?(x)'],
  collectCoverage: false,
  transform: {
    '.(ts)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js'],
  clearMocks: true,
  coverageDirectory: 'reports/coverage',
  coverageReporters: ['text', 'lcov', 'cobertura'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'src/*.{ts,tsx}',
    '!index.ts',
    '!**/lib/**',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  globalSetup: './__tests__/before.ts',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testTimeout: 40000,
};
