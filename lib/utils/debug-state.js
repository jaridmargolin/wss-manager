'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
const { padStart, padEnd, uniqueId } = require('lodash')
const { debugProp } = require('debug-prop')

/* -----------------------------------------------------------------------------
 * debugState
 * -------------------------------------------------------------------------- */

module.exports = function debugState(target) {
  debugProp('state', target, function (val) {
    const identifier = this.uuid ? `[${this.uuid}]` : ''
    const prefix = padEnd(`${this.constructor.name}${identifier}`, 22)

    console.log(`${prefix}: ${val}`)
  })

  Object.defineProperty(target, 'uuid', {
    get () {
      return this._uuid || (this._uuid = padStart(uniqueId(), 4, '0'))
    }
  })
}
