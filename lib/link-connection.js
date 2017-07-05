'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
const { createConnection } = require('net')
const { Transform } = require('stream')

// lib
const BaseConnection = require('./base-connection')

/* -----------------------------------------------------------------------------
 * Valve
 * -------------------------------------------------------------------------- */

class Valve extends Transform {
  constructor (...args) {
    super(...args)
    this.dropRate = 0
  }

  _transform (chunk, enc, done) {
    return parseInt(this.dropRate) > 0
      ? done()
      : done(null, chunk)
  }
}

/* -----------------------------------------------------------------------------
 * LinkConnection
 * -------------------------------------------------------------------------- */

module.exports = class LinkConnection extends BaseConnection {
  constructor (fromConnection, opts = {}) {
    super(fromConnection, opts)

    this.upstream = new Valve()
    this.downstream = new Valve()
    this.fromConnection = fromConnection
    this.toConnection = createConnection({
      host: 'localhost',
      port: this.opts.to
    })

    this.setDropRate(opts.dropRate)
    this._togglePipes(true)
  }

  closeConnection () {
    this._togglePipes(false)
    this.fromConnection.destroy()
    this.toConnection.destroy()
  }

  setDropRate (link, rate) {
    this.upstream.dropRate = rate
    this.downstream.dropRate = rate
  }

  _togglePipes (on) {
    const pipeMethod = on ? 'pipe' : 'unpipe'

    this.toConnection[pipeMethod](this.upstream)
    this.upstream[pipeMethod](this.fromConnection)
    this.fromConnection[pipeMethod](this.downstream)
    this.downstream[pipeMethod](this.toConnection)
  }
}
