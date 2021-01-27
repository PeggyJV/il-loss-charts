const path = require('path');

module.exports = {
    root: true,
    env: {
        es2021: true,
        browser: true,
        node: true
    },
    parserOptions: {
        project: path.join(__dirname, './tsconfig.json'),
        sourceType: 'module',
    },
    extends: [
        '../../.eslintrc.json',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
    ],
    rules: {
        'react/react-in-jsx-scope': 'off',
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
}