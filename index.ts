import cookie from 'cookie';
import fs from 'fs';

import { BunType, WebSocketWithData, DebugHTTPServer } from './types';
import { clients } from './store';
import {
    getPostCommentsHandler,
    getPostRatingHandler,
    updatePostRatingHandler,
} from './events';
import { broadcastOnClose, broadcastOnOpen } from './broadcasters';
import { WEBSOCKET_PORT } from './config';

const TLS_KEY = process.env.TLS_KEY || '';
const TLS_CERT = process.env.TLS_CERT || '';

// @ts-ignore
const server = Bun.serve({
    port: WEBSOCKET_PORT,
    tls: {
        key: TLS_KEY ? fs.readFileSync(TLS_KEY) : undefined,
        cert: TLS_CERT ? fs.readFileSync(TLS_CERT) : undefined,
    },
    fetch(req: Request, server: DebugHTTPServer) {
        const cookies = cookie.parse(req.headers.get('Cookie') || '');

        const isUpgraded = server.upgrade(req, {
            data: {
                cookies,
            },
        });

        if (isUpgraded) {
            return;
        }

        return new Response("Error");
    },
    websocket: {
        open(ws: WebSocketWithData) {
            clients.add(ws);

            broadcastOnOpen();
        },

        close(ws: WebSocketWithData) {
            clients.delete(ws);

            broadcastOnClose()
        },

        async message(ws: WebSocketWithData, message: string) {
            const sessionId = ws.data.cookies.sessionId;

            if (!sessionId) {
                return;
            }

            const msg = JSON.parse(message);

            switch (msg.type) {
                case 'UPDATE_POST_RATING': {
                    updatePostRatingHandler(ws, msg.postId, msg.value);
                    break;
                }
                case 'GET_POST_RATING': {
                    getPostRatingHandler(ws, msg.postId);
                    break;
                }
                case 'GET_POST_COMMENTS': {
                    getPostCommentsHandler(ws, msg.postId);
                    break;
                }
                default: {
                    ws.close();
                }
            }
        },
    },
}) satisfies BunType;

console.log(`Server is up! http://${server.hostname}:8090/`);
