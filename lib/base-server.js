'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// 3rd party
const defer = require('p-defer')

// lib
const debugState = require('./utils/debug-state')

/* -----------------------------------------------------------------------------
 * BaseServer
 * -------------------------------------------------------------------------- */

module.exports = class BaseServer {
  constructor(opts) {
    debugState(this)

    this.opts = opts
    this.state = 'stopped'
    this.connections = new Set()

    this._addConnection = this._addConnection.bind(this)
  }

  start () {
    delete this._stopDeferred

    if (this.state === 'started') {
      return Promise.resolve()
    }

    if (this.state === 'starting') {
      return this._startDeferred.promise
    }

    this._startDeferred = defer()
    this.state = 'starting'

    this.server = this.createServer()
    this.server.on('connection', this._addConnection)
    this.server.once('listening', __ => {
      delete this._startDeferred
      this.state = 'started'
      this._startDeferred.resolve(this.server)
    })

    return this._startDeferred.promise
  }

  stop () {
    delete this._startDeferred

    if (this.state === 'stopped') {
      return Promise.resolve()
    }

    if (this.state === 'stopping') {
      return this._stopDeferred.promise
    }

    this._stopDeferred = defer()
    this.state = 'stopping'

    this.server.removeListener('connection', this._addConnection)

    for (let connection of this.connections) {
      connection.close()
    }

    this.server.close(__ => {
      delete this.server
      delete this._stopDeferred
      this.state = 'stopped'
      this._stopDeferred.resolve()
    })

    return this._stopDeferred.promise
  }

  createServer () {
    throw new Error('Must define a `createServer` method.')
  }

  createConnection () {
    throw new Error('Must define a `createConnection` method.')
  }

  _addConnection (socket) {
    const connection = this.createConnection(socket)

    connection.on('close', __ => this.connections.delete(connection))
    return this.connections.add(connection)
  }
}
