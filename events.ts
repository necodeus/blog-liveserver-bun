import {
    WebSocketWithData,
    GetPostCommentHandlerType,
    RatingsAverageHandlerType,
    SubscriberErrorHandlerType,
    SubscriberMessageHandlerType,
    UpdatePostRatingHandlerType,
} from './types';
import { redisClients } from './store';
import { broadcastOnPostRatingChange } from './broadcasters';
import { getComments, saveRating } from './blog/api';

export const subscriberErrorHandler: SubscriberErrorHandlerType = (error) => {
    if (error) {
        console.error('REDIS SUB ERROR(GENERAL): %s', error.message);
    }
}

export const ratingsAverageHandler: RatingsAverageHandlerType = (error) => {
    if (error) {
        console.error("REDIS SUB ERROR(RATINGS): %s", error.message);
    }
}

export const subscriberMessageHandler: SubscriberMessageHandlerType = (channel, message) => {
    if (channel === "RATINGS_AVERAGE") {
        broadcastOnPostRatingChange(message);
    }
}

export const getPostCommentsHandler: GetPostCommentHandlerType = async (ws, postId) => {
    const sessionId = ws.data.cookies.sessionId;

    const { comments } = await getComments(sessionId, postId);

    ws.send(JSON.stringify({
        type: 'POST_COMMENTS',
        postId,
        comments,
    }));
}

type GetPostRatingHandlerType = (ws: WebSocketWithData, postId: string) => Promise<void>;

export const getPostRatingHandler: GetPostRatingHandlerType = async (ws, postId) => {
    const result = await redisClients.redis.get(`RATINGS_AV:${postId}`);

    ws.data.previousPageId = ws.data.currentPageId
    ws.data.currentPageId = postId

    ws.send(JSON.stringify({
        type: 'RATINGS_AVERAGE',
        postId,
        average: result,
    }));
}

export const updatePostRatingHandler: UpdatePostRatingHandlerType = async (ws, postId, value) => {
    const sessionId = ws.data.cookies.sessionId;

    const rating = await saveRating(sessionId, postId, value);

    redisClients.pub.publish("RATINGS_AVERAGE", JSON.stringify({
        type: 'RATINGS_AVERAGE',
        postId,
        average: rating?.average,
    }));

    redisClients.redis.set(`RATINGS_AV:${postId}`, `${rating?.average}`);
}
