'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// lib
const BaseConnection = require('./base-connection')

/* -----------------------------------------------------------------------------
 * WSConnection
 * -------------------------------------------------------------------------- */

module.exports = class WSConnection extends BaseConnection {
  constructor (connection, opts) {
    super(connection, opts)

    this._onMessage = this._onMessage.bind(this)
    this.connection.on('message', this._onMessage)
  }

  closeConnection () {
    this.connection.close()
    this.connection.removeListener('message', this._onMessage)
  }

  _onMessage (data) {
    this.connection.send(JSON.stringify({ msg: 'receipt' }))
  }
}
