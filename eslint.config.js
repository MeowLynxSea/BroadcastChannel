import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  astro: true,
  ignores: ['scripts/*.js'],
  rules: {
    'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
    'format/prettier': 'off',
  },
})
