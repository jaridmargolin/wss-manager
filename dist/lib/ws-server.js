'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */
// core
const util_1 = require("util");
// 3rd party
const ws_1 = require("ws");
const async_1 = require("@inventory/async");
// lib
const debug_status_1 = __importDefault(require("./utils/debug-status"));
var WSConnectionStatus;
(function (WSConnectionStatus) {
    WSConnectionStatus["OPENED"] = "OPENED";
    WSConnectionStatus["CLOSED"] = "CLOSED";
})(WSConnectionStatus = exports.WSConnectionStatus || (exports.WSConnectionStatus = {}));
class WSConnection {
    constructor(socket, { messageHandler } = {}) {
        this._onMessage = (data) => {
            const reply = this._socket.send.bind(this._socket);
            this._messageHandler ? this._messageHandler(data, reply) : reply(data);
        };
        this._onClose = () => {
            this.close();
        };
        debug_status_1.default(this, 'wss-manager:ws-connection');
        this._messageHandler = messageHandler;
        this.status = WSConnectionStatus.OPENED;
        this._socket = socket;
        this._socket.on('message', this._onMessage);
        this._socket.once('close', this._onClose);
    }
    close() {
        this._socket.off('close', this._onClose);
        this._socket.removeListener('message', this._onMessage);
        if (this.status === WSConnectionStatus.OPENED) {
            this.status = WSConnectionStatus.CLOSED;
            this._socket.close();
        }
    }
}
exports.WSConnection = WSConnection;
/* -----------------------------------------------------------------------------
 * WSServer
 * -------------------------------------------------------------------------- */
var WSServerStatus;
(function (WSServerStatus) {
    WSServerStatus["STARTED"] = "STARTED";
    WSServerStatus["STOPPED"] = "STOPPED";
})(WSServerStatus = exports.WSServerStatus || (exports.WSServerStatus = {}));
class WSServer {
    constructor(options) {
        this._connections = new Set();
        this._onConnection = (socket) => {
            const connection = new WSConnection(socket, {
                messageHandler: this._options.messageHandler
            });
            socket.on('close', () => this._connections.delete(connection));
            this._connections.add(connection);
        };
        debug_status_1.default(this, 'wss-manager:ws-server');
        this.status = WSServerStatus.STOPPED;
        this._options = options;
    }
    async start() {
        if (this.status === WSServerStatus.STOPPED) {
            const server = new ws_1.Server({ port: this._options.port });
            server.on('connection', this._onConnection);
            await new async_1.EventListener(server, 'listening');
            this.status = WSServerStatus.STARTED;
            this._server = server;
        }
        return this;
    }
    async stop() {
        if (this.status === WSServerStatus.STARTED) {
            this._server.off('connection', this._onConnection);
            for (let connection of this._connections) {
                connection.close();
            }
            await util_1.promisify(this._server.close.bind(this._server))();
            this.status = WSServerStatus.STOPPED;
        }
        return this;
    }
}
exports.default = WSServer;
