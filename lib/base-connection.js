'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
const EventEmitter = require('events')

// lib
const debugState = require('./utils/debug-state')

/* -----------------------------------------------------------------------------
 * BaseConnection
 * -------------------------------------------------------------------------- */

module.exports = class BaseConnection extends EventEmitter {
  constructor(connection, opts) {
    super()
    debugState(this)

    this.opts = opts
    this.state = 'opened'
    this.connection = connection

    this.close = this.close.bind(this)
    connection.once('close', this.close)
  }

  close () {
    this.connection.removeListener('close', this.close)

    if (this.state === 'opened') {
      this.closeConnection()

      this.state = 'closed'
      this.emit('closed')
    }
  }

  closeConnection () {
    throw new Error('Must define a `closeConnection` method.')
  }
}
