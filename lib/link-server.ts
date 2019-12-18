'use strict'

/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */

// core
import { createServer, createConnection, Server, Socket } from 'net'
import { Transform, TransformCallback } from 'stream'

// 3rd party
import { EventListener } from '@inventory/async'

// lib
import debugStatus from './utils/debug-status'

/* -----------------------------------------------------------------------------
 * Valve
 * -------------------------------------------------------------------------- */

class Valve extends Transform {
  dropRate = 0

  // Currently the valve is all or nothing. Ideally, we would be able to
  // drop percentages of pacakges. Not a requirement yet of current tools
  // utilizing the lib.
  _transform (chunk: any, encoding: string, callback: TransformCallback) {
    return this.dropRate > 0 ? callback() : callback(null, chunk)
  }
}

/* -----------------------------------------------------------------------------
 * LinkConnection
 * -------------------------------------------------------------------------- */

export enum LinkConnectionStatus {
  OPENED = 'OPENED',
  CLOSED = 'CLOSED'
}

export interface LinkConnectionOptions {
  destinationPort: number
  dropRate?: number
}

export class LinkConnection {
  status: LinkConnectionStatus

  protected _upstream = new Valve()
  protected _downstream = new Valve()
  protected _originConnection: Socket
  protected _destinationConnection: Socket

  constructor (
    socket: Socket,
    { destinationPort, dropRate = 0 }: LinkConnectionOptions
  ) {
    debugStatus(this, 'wss-manager:link-connection')

    this.status = LinkConnectionStatus.OPENED
    this.setDropRate(dropRate)

    this._originConnection = socket
    this._originConnection.once('close', this._onClose)

    this._destinationConnection = createConnection({
      host: 'localhost',
      port: destinationPort
    })

    this._destinationConnection.pipe(this._upstream)
    this._upstream.pipe(this._originConnection)
    this._originConnection.pipe(this._downstream)
    this._downstream.pipe(this._destinationConnection)
  }

  close () {
    this._originConnection.off('close', this._onClose)

    if (this.status === LinkConnectionStatus.OPENED) {
      this.status = LinkConnectionStatus.CLOSED

      this._destinationConnection.unpipe(this._upstream)
      this._upstream.unpipe(this._originConnection)
      this._originConnection.unpipe(this._downstream)
      this._downstream.unpipe(this._destinationConnection)

      // TODO: socket.end(cb) ?
      this._originConnection.destroy()
      this._destinationConnection.destroy()
    }
  }

  setDropRate (rate: number) {
    this._upstream.dropRate = rate
    this._downstream.dropRate = rate
  }

  protected _onClose = () => {
    this.close()
  }
}

/* -----------------------------------------------------------------------------
 * LinkServer
 * -------------------------------------------------------------------------- */

export enum LinkServerStatus {
  STARTED = 'STARTED',
  STOPPED = 'STOPPED'
}

export interface LinkServerOptions {
  port: number
  destinationPort: number
  dropRate?: number
}

export default class LinkServer {
  status: LinkServerStatus

  protected _server?: Server
  protected _options: LinkServerOptions
  protected _connections: Set<LinkConnection> = new Set()

  constructor (options: LinkServerOptions) {
    debugStatus(this, 'wss-manager:link-server')

    this.status = LinkServerStatus.STOPPED
    this._options = options
  }

  async start () {
    if (this.status === LinkServerStatus.STOPPED) {
      const server = createServer().listen(this._options.port, 'localhost')
      server.on('connection', this._onConnection)

      await new EventListener(server, 'listening')

      this.status = LinkServerStatus.STARTED
      this._server = server
    }

    return this
  }

  async stop () {
    if (this.status === LinkServerStatus.STARTED) {
      this._server!.off('connection', this._onConnection)
      for (let connection of this._connections) {
        connection.close()
      }

      this._server!.close()
      await new EventListener(this._server!, 'close')

      this.status = LinkServerStatus.STOPPED
    }

    return this
  }

  setDropRate (dropRate: number) {
    this._options.dropRate = dropRate

    for (let connection of this._connections) {
      connection.setDropRate(dropRate)
    }
  }

  protected _onConnection = (socket: Socket) => {
    const connection = new LinkConnection(socket, {
      dropRate: this._options.dropRate,
      destinationPort: this._options.destinationPort
    })

    socket.on('close', () => this._connections.delete(connection))
    this._connections.add(connection)
  }
}
