module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // TypeScript用パーサ
  parserOptions: {
    ecmaVersion: 'latest',  // モダンな構文を許可
    sourceType: 'module',   // import/exportを許可
    project: './tsconfig.json', // 型情報を使うルールで必要
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',          // 型なしルール
    'plugin:@typescript-eslint/recommended-requiring-type-checking', // 型を使うルール
    'plugin:prettier/recommended', // Prettier連携 (任意)
  ],
  rules: {
    // カスタムルール例
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    'no-console': 'warn',
  },
};
