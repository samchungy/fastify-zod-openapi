const skuba = require('eslint-config-skuba');
const importZod = require('eslint-plugin-import-zod');
const zodOpenapi = require('eslint-plugin-zod-openapi');

module.exports = [
  {
    ignores: ['src/openapi3-ts/*'],
  },
  ...skuba,
  ...importZod.configs.recommended,
  {
    plugins: {
      'zod-openapi': zodOpenapi,
    },
  },
  {
    files: ['examples/**/*/types/**/*.ts'],

    rules: {
      'zod-openapi/require-meta': 'error',
      'zod-openapi/require-comment': 'error',
      'zod-openapi/require-example': 'error',
      'zod-openapi/prefer-meta-last': 'error',
      'zod-openapi/prefer-zod-default': 'error',
    },
  },
];
