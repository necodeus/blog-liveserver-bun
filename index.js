const WebSocket = require('ws');
const Redis = require('ioredis');
const cookie = require('cookie');
const axios = require('axios');

const sub = new Redis({
    port: 6379,
    host: "localhost",
});

const pub = new Redis({
    port: 6379,
    host: "localhost",
});

const wss = new WebSocket.Server({ port: 8090 });

// TODO: Add actions like: comment, upvote, downvote

async function saveRating(sessionId, postId, value) {
    try {
        const { data } = await axios.post(`http://paper-api.localhost/api/v1/posts/${postId}/rate`, {
            sessionId,
            value,
        })

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
        const { postId, value } = JSON.parse(message);

        const sessionId = ws.sessionId;

        // Save rating in DB and get average
        const data = await saveRating(sessionId, postId, value);

        pub.publish("RATINGS_AVERAGE", JSON.stringify({
            postId,
            average: data.average,
        }));
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
