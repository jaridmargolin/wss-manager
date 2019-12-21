import WebSocket, { Server } from 'ws';
export declare type WSMessageHandler = (data: WebSocket.Data, reply: (data: WebSocket.Data) => void) => void;
export interface WSConnectionOptions {
    messageHandler?: WSMessageHandler;
}
export declare enum WSConnectionStatus {
    OPENED = "OPENED",
    CLOSED = "CLOSED"
}
export declare class WSConnection {
    status: WSConnectionStatus;
    protected _socket: WebSocket;
    protected _messageHandler?: WSMessageHandler;
    constructor(socket: WebSocket, { messageHandler }?: WSConnectionOptions);
    close(): void;
    protected _onMessage: (data: WebSocket.Data) => void;
    protected _onClose: () => void;
}
export declare enum WSServerStatus {
    STARTED = "STARTED",
    STOPPED = "STOPPED"
}
export interface WSServerOptions {
    port: number;
    messageHandler?: WSMessageHandler;
}
export default class WSServer {
    status: WSServerStatus;
    protected _server?: Server;
    protected _options: WSServerOptions;
    protected _connections: Set<WSConnection>;
    constructor(options: WSServerOptions);
    start(): Promise<this>;
    stop(): Promise<this>;
    protected _onConnection: (socket: WebSocket) => void;
}
