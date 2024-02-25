import { Redis } from "ioredis";
import { WebSocketWithData } from "./types";
import {
    ratingsAverageHandler,
    subscriberErrorHandler,
    subscriberMessageHandler,
} from "./events";
import { REDIS_OPTIONS } from "./config";

/** WEBSOCKET CLIENTS (USERS) */

const clients: Set<WebSocketWithData> = new Set();

/** REDIS CLIENTS (SERVER CONNECTIONS) */

const redisClients = {
    redis: new Redis(REDIS_OPTIONS),
    pub: new Redis(REDIS_OPTIONS),
    sub: new Redis(REDIS_OPTIONS),
};

redisClients.sub.subscribe("RATINGS_AVERAGE", ratingsAverageHandler);
redisClients.sub.subscribe("COMMENTS", () => {});
redisClients.sub.on("message", subscriberMessageHandler);
redisClients.sub.on('error', subscriberErrorHandler);

export {
    clients,
    redisClients,
};
