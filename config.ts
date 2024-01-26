import { RedisOptions } from "ioredis";

// EXTERNAL API
export const BLOG_API_URL = process.env.BLOG_API_URL || 'http://paper-api.localhost';

// WEBSOCKET

export const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 8090;

// REDIS

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT as (number | undefined) || 6379;

export const REDIS_OPTIONS: RedisOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
};
