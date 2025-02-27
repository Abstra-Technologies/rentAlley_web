// const nextJest = require('next/jest');
//
// const createJestConfig = nextJest({
//     dir: './',
// });
//
// const customJestConfig = {
//     setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Update to .ts file
//     moduleNameMapper: {
//         '^@/(.*)$': '<rootDir>/src/$1',
//         '\\.(css|scss|sass)$': 'identity-obj-proxy',
//     },
//     testEnvironment: 'jest-environment-jsdom',
// };
//
// module.exports = createJestConfig(customJestConfig);

const nextJest = require("next/jest");

const createJestConfig = nextJest({
    dir: "./",
});

const customJestConfig = {
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    testEnvironment: "jest-environment-jsdom",
    transform: {
        "^.+\\.(js|jsx)$": ["babel-jest", { presets: ["next/babel"] }],
    },
    transformIgnorePatterns: [
        "node_modules/(?!(next)/)", // Ensures Jest transpiles Next.js components
        "node_modules/(?!(lucide-react)/)", // ✅ Transpile lucide-react (ESM)
    ],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1", // Adjust alias if needed
        "\\.(css|scss|sass)$": "identity-obj-proxy", // Mock styles
    },
};

module.exports = createJestConfig(customJestConfig);
