'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
const { Server } = require('ws')

// lib
const BaseServer = require('./base-server')
const WSConnection = require('./ws-connection')

/* -----------------------------------------------------------------------------
 * WSServer
 * -------------------------------------------------------------------------- */

module.exports = class WSServer extends BaseServer {
  createServer () {
    return new Server(this.opts)
  }

  createConnection (socket) {
    return new WSConnection(socket, { debug: this.opts.debug })
  }
}
