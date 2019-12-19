'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */
// core
const net_1 = require("net");
const stream_1 = require("stream");
// 3rd party
const async_1 = require("@inventory/async");
// lib
const debug_status_1 = __importDefault(require("./utils/debug-status"));
/* -----------------------------------------------------------------------------
 * Valve
 * -------------------------------------------------------------------------- */
class Valve extends stream_1.Transform {
    constructor() {
        super(...arguments);
        this.dropRate = 0;
    }
    // Currently the valve is all or nothing. Ideally, we would be able to
    // drop percentages of pacakges. Not a requirement yet of current tools
    // utilizing the lib.
    _transform(chunk, encoding, callback) {
        return this.dropRate > 0 ? callback() : callback(null, chunk);
    }
}
/* -----------------------------------------------------------------------------
 * LinkConnection
 * -------------------------------------------------------------------------- */
var LinkConnectionStatus;
(function (LinkConnectionStatus) {
    LinkConnectionStatus["OPENED"] = "OPENED";
    LinkConnectionStatus["CLOSED"] = "CLOSED";
})(LinkConnectionStatus = exports.LinkConnectionStatus || (exports.LinkConnectionStatus = {}));
class LinkConnection {
    constructor(socket, { destinationPort, dropRate = 0 }) {
        this._upstream = new Valve();
        this._downstream = new Valve();
        this._onClose = () => {
            this.close();
        };
        debug_status_1.default(this, 'wss-manager:link-connection');
        this.status = LinkConnectionStatus.OPENED;
        this.setDropRate(dropRate);
        this._originConnection = socket;
        this._originConnection.once('close', this._onClose);
        this._destinationConnection = net_1.createConnection({
            host: 'localhost',
            port: destinationPort
        });
        this._destinationConnection.pipe(this._upstream);
        this._upstream.pipe(this._originConnection);
        this._originConnection.pipe(this._downstream);
        this._downstream.pipe(this._destinationConnection);
    }
    close() {
        this._originConnection.off('close', this._onClose);
        if (this.status === LinkConnectionStatus.OPENED) {
            this.status = LinkConnectionStatus.CLOSED;
            this._destinationConnection.unpipe(this._upstream);
            this._upstream.unpipe(this._originConnection);
            this._originConnection.unpipe(this._downstream);
            this._downstream.unpipe(this._destinationConnection);
            // TODO: socket.end(cb) ?
            this._originConnection.destroy();
            this._destinationConnection.destroy();
        }
    }
    setDropRate(rate) {
        this._upstream.dropRate = rate;
        this._downstream.dropRate = rate;
    }
}
exports.LinkConnection = LinkConnection;
/* -----------------------------------------------------------------------------
 * LinkServer
 * -------------------------------------------------------------------------- */
var LinkServerStatus;
(function (LinkServerStatus) {
    LinkServerStatus["STARTED"] = "STARTED";
    LinkServerStatus["STOPPED"] = "STOPPED";
})(LinkServerStatus = exports.LinkServerStatus || (exports.LinkServerStatus = {}));
class LinkServer {
    constructor(options) {
        this._connections = new Set();
        this._onConnection = (socket) => {
            const connection = new LinkConnection(socket, {
                dropRate: this._options.dropRate,
                destinationPort: this._options.destinationPort
            });
            socket.on('close', () => this._connections.delete(connection));
            this._connections.add(connection);
        };
        debug_status_1.default(this, 'wss-manager:link-server');
        this.status = LinkServerStatus.STOPPED;
        this._options = options;
    }
    async start() {
        if (this.status === LinkServerStatus.STOPPED) {
            const server = net_1.createServer().listen(this._options.port, 'localhost');
            server.on('connection', this._onConnection);
            await new async_1.EventListener(server, 'listening');
            this.status = LinkServerStatus.STARTED;
            this._server = server;
        }
        return this;
    }
    async stop() {
        if (this.status === LinkServerStatus.STARTED) {
            this._server.off('connection', this._onConnection);
            for (let connection of this._connections) {
                connection.close();
            }
            this._server.close();
            await new async_1.EventListener(this._server, 'close');
            this.status = LinkServerStatus.STOPPED;
        }
        return this;
    }
    setDropRate(dropRate) {
        this._options.dropRate = dropRate;
        for (let connection of this._connections) {
            connection.setDropRate(dropRate);
        }
    }
}
exports.default = LinkServer;
