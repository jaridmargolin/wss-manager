import WSServer, { WSMessageHandler } from './ws-server';
import LinkServer from './link-server';
import Hapi from 'hapi';
export interface WSSManagerOptions {
    WSServer: typeof WSServer;
    wsPort: number;
    wsMessageHandler?: WSMessageHandler;
    LinkServer: typeof LinkServer;
    linkPort: number;
    apiPort: number;
}
export default class WSSManager {
    static defaults: WSSManagerOptions;
    protected _apiServer: Hapi.Server;
    protected _wsServer: WSServer;
    protected _linkServer: LinkServer;
    constructor(options?: Partial<WSSManagerOptions>);
    start(): Promise<void>;
    stop(): Promise<void>;
    protected _handleStart: () => Promise<null>;
    protected _handleStop: () => Promise<null>;
    protected _handleBlock: () => Promise<null>;
    protected _handleUnblock: () => Promise<null>;
}
