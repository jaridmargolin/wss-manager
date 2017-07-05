'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
const { createServer } = require('net')

// lib
const BaseServer = require('./base-server')
const LinkConnection = require('./link-connection')

/* -----------------------------------------------------------------------------
 * LinkServer
 * -------------------------------------------------------------------------- */

module.exports = class LinkServer extends BaseServer {
  get dropRate () {
    return this._dropRate || (this._dropRate = 0)
  }

  set dropRate (val) {
    this._dropRate = val

    for (let connection of this.connections) {
      connection.setDropRate(this.dropRate)
    }
  }

  createServer () {
    return createServer().listen(this.opts.on, 'localhost')
  }

  createConnection (socket) {
    return new LinkConnection(socket, {
      dropRate: this.dropRate,
      debug: this.opts.debug,
      to: this.opts.to
    })
  }
}
