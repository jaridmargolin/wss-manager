'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */
// core
import { promisify } from 'util'

// 3rd party
import WebSocket, { Server } from 'ws'
import { EventListener } from '@inventory/async'

// lib
import debugStatus from './utils/debug-status'

/* -----------------------------------------------------------------------------
 * WSConnection
 * -------------------------------------------------------------------------- */

export type WSMessageHandler = (
  data: WebSocket.Data,
  reply: (data: WebSocket.Data) => void
) => void

export interface WSConnectionOptions {
  messageHandler?: WSMessageHandler
}

export enum WSConnectionStatus {
  OPENED = 'OPENED',
  CLOSED = 'CLOSED'
}

export class WSConnection {
  status: WSConnectionStatus

  protected _socket: WebSocket
  protected _messageHandler?: WSMessageHandler

  constructor (socket: WebSocket, { messageHandler }: WSConnectionOptions = {}) {
    debugStatus(this, 'wss-manager:ws-connection')

    this._messageHandler = messageHandler
    this.status = WSConnectionStatus.OPENED
    this._socket = socket
    this._socket.on('message', this._onMessage)
    this._socket.once('close', this._onClose)
  }

  close () {
    this._socket.off('close', this._onClose)
    this._socket.removeListener('message', this._onMessage)
    if (this.status === WSConnectionStatus.OPENED) {
      this.status = WSConnectionStatus.CLOSED
      this._socket.close()
    }
  }

  protected _onMessage = (data: WebSocket.Data) => {
    const reply = this._socket.send.bind(this._socket)
    this._messageHandler ? this._messageHandler(data, reply) : reply(data)
  }

  protected _onClose = () => {
    this.close()
  }
}

/* -----------------------------------------------------------------------------
 * WSServer
 * -------------------------------------------------------------------------- */

export enum WSServerStatus {
  STARTED = 'STARTED',
  STOPPED = 'STOPPED'
}

export interface WSServerOptions {
  port: number
  messageHandler?: WSMessageHandler
}

export default class WSServer {
  status: WSServerStatus

  protected _server?: Server
  protected _options: WSServerOptions
  protected _connections: Set<WSConnection> = new Set()

  constructor (options: WSServerOptions) {
    debugStatus(this, 'wss-manager:ws-server')

    this.status = WSServerStatus.STOPPED
    this._options = options
  }

  async start () {
    if (this.status === WSServerStatus.STOPPED) {
      const server = new Server({ port: this._options.port })
      server.on('connection', this._onConnection)

      await new EventListener(server, 'listening')

      this.status = WSServerStatus.STARTED
      this._server = server
    }

    return this
  }

  async stop () {
    if (this.status === WSServerStatus.STARTED) {
      this._server!.off('connection', this._onConnection)
      for (let connection of this._connections) {
        connection.close()
      }

      await promisify(this._server!.close.bind(this._server))()

      this.status = WSServerStatus.STOPPED
    }

    return this
  }

  protected _onConnection = (socket: WebSocket) => {
    const connection = new WSConnection(socket, {
      messageHandler: this._options.messageHandler
    })

    socket.on('close', () => this._connections.delete(connection))
    this._connections.add(connection)
  }
}
