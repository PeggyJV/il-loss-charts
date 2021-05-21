const path = require('path');

module.exports = {
    root: true,
    parserOptions: {
        project: path.join(__dirname, './tsconfig.json'),
        sourceType: 'module',
    },
    extends: ['../.eslintrc.json'],
};
