export default {
  testPathIgnorePatterns: ['<rootDir>/devlinks/'],
  modulePathIgnorePatterns: ['<rootDir>/devlinks/'],
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
}
