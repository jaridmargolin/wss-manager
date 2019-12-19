'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* -----------------------------------------------------------------------------
 * dependencies
 * -------------------------------------------------------------------------- */
// lib
const ws_server_1 = __importDefault(require("./ws-server"));
const link_server_1 = __importDefault(require("./link-server"));
const hapi_1 = __importDefault(require("hapi"));
class WSSManager {
    constructor(options) {
        this._handleStart = async () => {
            await this._wsServer.start();
            await this._linkServer.start();
            return null;
        };
        this._handleStop = async () => {
            await this._linkServer.stop();
            await this._wsServer.stop();
            return null;
        };
        this._handleBlock = async () => {
            this._linkServer.setDropRate(1);
            return null;
        };
        this._handleUnblock = async () => {
            this._linkServer.setDropRate(0);
            return null;
        };
        const { defaults } = this.constructor;
        const { WSServer, LinkServer, ...opts } = Object.assign(defaults, options);
        this._wsServer = new WSServer({
            port: opts.wsPort,
            messageHandler: opts.wsMessageHandler
        });
        this._linkServer = new LinkServer({
            port: opts.linkPort,
            destinationPort: opts.wsPort
        });
        this._apiServer = new hapi_1.default.Server({
            port: opts.apiPort,
            host: 'localhost',
            routes: { cors: true }
        });
    }
    async start() {
        await this._apiServer.start();
        this._apiServer.route({
            method: 'POST',
            path: `/start`,
            handler: this._handleStart
        });
        this._apiServer.route({
            method: 'POST',
            path: `/stop`,
            handler: this._handleStop
        });
        this._apiServer.route({
            method: 'POST',
            path: `/block`,
            handler: this._handleBlock
        });
        this._apiServer.route({
            method: 'POST',
            path: `/unblock`,
            handler: this._handleUnblock
        });
        await this._wsServer.start();
        await this._linkServer.start();
    }
    async stop() {
        await this._apiServer.stop();
        await this._wsServer.stop();
        await this._linkServer.stop();
    }
}
exports.default = WSSManager;
WSSManager.defaults = {
    WSServer: ws_server_1.default,
    wsPort: 9995,
    LinkServer: link_server_1.default,
    linkPort: 9996,
    apiPort: 9997
};
