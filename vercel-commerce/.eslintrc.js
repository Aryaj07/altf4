module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['next', 'eslint:recommended', 'prettier'],
  plugins: [],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': [
      'error',
      {
        args: 'after-used',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
        vars: 'all',
        argsIgnorePattern: "^_"
      },
    ],
    'prefer-const': 'error',
    'react-hooks/exhaustive-deps': 'error',
    // Removed all unicorn rules
  },
};