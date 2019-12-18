'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// lib
import WSServer, { WSMessageHandler } from './ws-server'
import LinkServer from './link-server'
import Hapi from 'hapi'

/* -----------------------------------------------------------------------------
 * WSSManager
 * -------------------------------------------------------------------------- */

export interface WSSManagerOptions {
  WSServer: typeof WSServer
  wsPort: number
  wsMessageHandler?: WSMessageHandler
  LinkServer: typeof LinkServer
  linkPort: number
  apiPort: number
}

export default class WSSManager {
  static defaults: WSSManagerOptions = {
    WSServer: WSServer,
    wsPort: 9995,
    LinkServer: LinkServer,
    linkPort: 9996,
    apiPort: 9997
  }

  protected _apiServer: Hapi.Server
  protected _wsServer: WSServer
  protected _linkServer: LinkServer

  constructor (options?: Partial<WSSManagerOptions>) {
    const { defaults } = this.constructor as typeof WSSManager
    const { WSServer, LinkServer, ...opts } = Object.assign(defaults, options)

    this._wsServer = new WSServer({
      port: opts.wsPort,
      messageHandler: opts.wsMessageHandler
    })

    this._linkServer = new LinkServer({
      port: opts.linkPort,
      destinationPort: opts.wsPort
    })

    this._apiServer = new Hapi.Server({
      port: opts.apiPort,
      host: 'localhost',
      routes: { cors: true }
    })
  }

  async start () {
    await this._apiServer.start()

    this._apiServer.route({
      method: 'POST',
      path: `/start`,
      handler: this._handleStart
    })

    this._apiServer.route({
      method: 'POST',
      path: `/stop`,
      handler: this._handleStop
    })

    this._apiServer.route({
      method: 'POST',
      path: `/block`,
      handler: this._handleBlock
    })

    this._apiServer.route({
      method: 'POST',
      path: `/unblock`,
      handler: this._handleUnblock
    })

    await this._wsServer.start()
    await this._linkServer.start()
  }

  async stop () {
    await this._apiServer.stop()
    await this._wsServer.stop()
    await this._linkServer.stop()
  }

  protected _handleStart = async () => {
    await this._wsServer.start()
    await this._linkServer.start()

    return null
  }

  protected _handleStop = async () => {
    await this._linkServer.stop()
    await this._wsServer.stop()

    return null
  }

  protected _handleBlock = async () => {
    this._linkServer.setDropRate(1)
    return null
  }

  protected _handleUnblock = async () => {
    this._linkServer.setDropRate(0)
    return null
  }
}
