import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    prettierConfig,
    {
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            'padding-line-between-statements': [
                'warn',
                { blankLine: 'always', prev: 'function', next: 'function' },
            ],
        },
    },
];
