module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: ['*.js', '!jest.config.js'],
    setupFilesAfterEnv: ['./jest.setup.js']
  };