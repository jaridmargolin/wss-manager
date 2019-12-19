/// <reference types="node" />
import { Server, Socket } from 'net';
import { Transform, TransformCallback } from 'stream';
declare class Valve extends Transform {
    dropRate: number;
    _transform(chunk: any, encoding: string, callback: TransformCallback): void;
}
export declare enum LinkConnectionStatus {
    OPENED = "OPENED",
    CLOSED = "CLOSED"
}
export interface LinkConnectionOptions {
    destinationPort: number;
    dropRate?: number;
}
export declare class LinkConnection {
    status: LinkConnectionStatus;
    protected _upstream: Valve;
    protected _downstream: Valve;
    protected _originConnection: Socket;
    protected _destinationConnection: Socket;
    constructor(socket: Socket, { destinationPort, dropRate }: LinkConnectionOptions);
    close(): void;
    setDropRate(rate: number): void;
    protected _onClose: () => void;
}
export declare enum LinkServerStatus {
    STARTED = "STARTED",
    STOPPED = "STOPPED"
}
export interface LinkServerOptions {
    port: number;
    destinationPort: number;
    dropRate?: number;
}
export default class LinkServer {
    status: LinkServerStatus;
    protected _server?: Server;
    protected _options: LinkServerOptions;
    protected _connections: Set<LinkConnection>;
    constructor(options: LinkServerOptions);
    start(): Promise<this>;
    stop(): Promise<this>;
    setDropRate(dropRate: number): void;
    protected _onConnection: (socket: Socket) => void;
}
export {};
