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
    },
    extends: ['../../.eslintrc.json'],
};
