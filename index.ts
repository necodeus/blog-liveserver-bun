import cookie from 'cookie';

import { BunType, WebSocketWithData, DebugHTTPServer } from './types';
import { clients } from './store';
import {
    getPostCommentsHandler,
    getPostRatingHandler,
    updatePostRatingHandler,
    addCommentHandler,
    upvoteCommentHandler,
    downvoteCommentHandler,
} from './events';
import { broadcastOnClose, broadcastOnOpen } from './broadcasters';
import { WEBSOCKET_PORT } from './config';

import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const prometheusExporter = new PrometheusExporter({
    port: 9464,
}, () => {
    console.log('Prometheus exporter is running on port 9464');
});

const meterProvider = new MeterProvider({});

meterProvider.addMetricReader(prometheusExporter);

const meter = meterProvider.getMeter('example-prometheus');

const connectionsCounter = meter.createCounter('websocket_connections', {
    description: 'Total number of WebSocket connections',
});

connectionsCounter.add(0);

const activeConnectionsGauge = meter.createUpDownCounter('websocket_active_connections', {
    description: 'Number of active WebSocket connections',
});
activeConnectionsGauge.add(0);

// @ts-ignore
const TLS_KEY = Bun.env.TLS_KEY || '';
// @ts-ignore
const TLS_CERT = Bun.env.TLS_CERT || '';

const isSecure = TLS_KEY && TLS_CERT;

if (isSecure) {
    console.log('Configuring TLS...');
    console.log('TLS_KEY=', TLS_KEY);
    console.log('TLS_CERT=', TLS_CERT);
}

// @ts-ignore
const server = Bun.serve({
    port: WEBSOCKET_PORT,
    tls: isSecure ? {
        // @ts-ignore
        cert: Bun.file(TLS_KEY),
        // @ts-ignore
        key: Bun.file(TLS_CERT),
    } : undefined,
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
            connectionsCounter.add(1);
            activeConnectionsGauge.add(1);
            broadcastOnOpen();
        },

        close(ws: WebSocketWithData) {
            clients.delete(ws);
            activeConnectionsGauge.add(-1);
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
                case 'ADD_COMMENT': {
                    addCommentHandler(ws, msg.postId, msg.commentId, msg.commentText);
                    break;
                }
                case 'UPVOTE_COMMENT': {
                    upvoteCommentHandler(ws, msg.postId, msg.commentId);
                    break;
                }
                case 'DOWNVOTE_COMMENT': {
                    downvoteCommentHandler(ws, msg.postId, msg.commentId);
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
