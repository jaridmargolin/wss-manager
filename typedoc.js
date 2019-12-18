'use strict'

/* -----------------------------------------------------------------------------
 * typedoc config
 * -------------------------------------------------------------------------- */

module.exports = {
  exclude: ['./lib/*.test.ts'],
  mode: 'file',
  out: './docs',
  readme: 'none',
  excludePrivate: true,
  excludeNotExported: true,
  outline: false
}
