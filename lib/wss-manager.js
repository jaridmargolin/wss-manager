'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// lib
const WSServer = require('./ws-server')
const LinkServer = require('./link-server')

/* -----------------------------------------------------------------------------
 * api
 * -------------------------------------------------------------------------- */

module.exports = class WSSManager {
  get WSServer () {
    return WSServer
  }

  get LinkServer () {
    return LinkServer
  }

  constructor (options) {
    const opts = Object.assign(
      {
        wsPort: 9995,
        linkPort: 9996,
        debug: false
      },
      options
    )

    const WSServer = opts.WSServer || this.WSServer
    this.wsServer = new WSServer({
      port: opts.wsPort,
      debug: opts.debug
    })

    const LinkServer = opts.LinkServer || this.LinkServer
    this.linkServer = new LinkServer({
      to: opts.wsPort,
      on: opts.linkPort,
      debug: opts.debug
    })
  }

  start () {
    return this.wsServer.start().then(__ => this.linkServer.start())
  }

  stop () {
    return this.linkServer.stop().then(__ => this.wsServer.stop())
  }

  close () {
    this.linkServer.dropRate = 1
  }

  open () {
    this.linkServer.dropRate = 0
  }
}
