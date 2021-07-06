const path = require('path');

module.exports = {
    root: true,
    plugins: ['unicorn'],
    parserOptions: {
        project: path.join(__dirname, './tsconfig.json'),
        sourceType: 'module',
    },
    rules: {
        'unicorn/expiring-todo-comments': 'error',
        'no-unused-vars': 'off', // use @typescript-eslint/no-unused-vars
        '@typescript-eslint/no-unused-vars': 'warn',
    },
    extends: ['../.eslintrc.json'],
};
