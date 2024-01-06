const https = require('https');
const http = require('http');
const WebSocket = require('ws');
const Redis = require('ioredis');
const cookie = require('cookie');
const axios = require('axios');

const fs = require('fs');

const prot = process.env.NODE_ENV === 'production' ? https : http;

const ssv = prot.createServer({
    cert: process.env.NODE_ENV === 'production' ? fs.readFileSync('/etc/letsencrypt/live/necodeo.com/fullchain.pem') : null,
    key:process.env.NODE_ENV === 'production' ?  fs.readFileSync('/etc/letsencrypt/live/necodeo.com/privkey.pem') : null,
});

let options = {};

if (process.env.NODE_ENV === 'production') {
    ssv.listen(8090);
    options.server = ssv;
} else {
    options.port = 8090;
}

ssv.on('request', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(';)');
});

const sub = new Redis({
    port: 6379,
    host: "localhost",
});

const pub = new Redis({
    port: 6379,
    host: "localhost",
});

const redis = new Redis({
    port: 6379,
    host: "localhost",
});

const wss = new WebSocket.Server(options);

// TODO: Add actions like: comment, upvote, downvote

async function saveRating(sessionId, postId, value) {
    try {
        if (!sessionId) { // not the place to check this
            return false;
        }

        const { data } = await axios.post(`https://paper-api.necodeo.com/api/v1/posts/${postId}/rate`, {
            sessionId,
            value,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

wss.on('connection', (ws, req) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    ws.sessionId = cookies.sessionId;

    ws.on('message', async (message) => {
        const sessionId = ws.sessionId;

        if (!sessionId) {
            return;
        }

        try {
            const msg = JSON.parse(message);

            if (msg.type === 'UPDATE_POST_RATING') {
                const rating = await saveRating(sessionId, msg.postId, msg.value);

                pub.publish("RATINGS_AVERAGE", JSON.stringify({
                    type: 'RATINGS_AVERAGE',
                    postId: msg.postId,
                    average: rating.average,
                }));

                redis.set(`RATINGS_AV:${msg.postId}`, `${rating.average}`);
            }

            if (msg.type === 'GET_POST_RATING') {
                const result = await redis.get(`RATINGS_AV:${msg.postId}`);

                ws.send(JSON.stringify({
                    type: 'RATINGS_AVERAGE',
                    postId: msg.postId,
                    average: result,
                }));
            }
        } catch (e) {
            console.error(e);
        }
    });
});

sub.on('error', function (error) {
    if (error) {
        console.error('REDIS SUB ERROR(GENERAL): %s', error.message);
    }
});

sub.subscribe("RATINGS_AVERAGE", (error) => {
    if (error) {
        console.error("REDIS SUB ERROR(RATINGS): %s", error.message);
    }
});

sub.on("message", (channel, message) => {
    if (channel === "RATINGS_AVERAGE") {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
});
