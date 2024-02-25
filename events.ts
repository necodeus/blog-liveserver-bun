import {
    GetPostCommentHandlerType,
    RatingsAverageHandlerType,
    SubscriberErrorHandlerType,
    SubscriberMessageHandlerType,
    UpdatePostRatingHandlerType,
    GetPostRatingHandlerType,
    AddCommentHandlerType,
    UpvoteCommentHandlerType,
    DownvoteCommentHandlerType,
} from './types';
import { redisClients } from './store';
import {
    // ratings
    broadcastOnPostRatingChange,
    // comments
    broadcastOnComment,
} from './broadcasters';
import {
    // ratings
    saveRating,
    // comments
    getComments,
    addComment,
    upvoteComment,
    downvoteComment,
} from './blog/api';

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
    if (channel === 'RATINGS_AVERAGE') {
        broadcastOnPostRatingChange(message);
    }
    if (channel === 'COMMENTS') {
        broadcastOnComment(message);
    }
}

export const getPostCommentsHandler: GetPostCommentHandlerType = async (ws, postId) => {
    console.log('GET_POST_COMMENTS', postId);

    const sessionId = ws.data.cookies.sessionId;

    const { comments } = await getComments(sessionId, postId);

    ws.send(JSON.stringify({
        type: 'POST_COMMENTS',
        postId,
        comments,
    }));
}

export const getPostRatingHandler: GetPostRatingHandlerType = async (ws, postId) => {
    console.log('GET_POST_RATING', postId);

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
    console.log('UPDATE_POST_RATING', postId, value);

    const sessionId = ws.data.cookies.sessionId;

    const rating = await saveRating(sessionId, postId, value);

    redisClients.pub.publish('RATINGS_AVERAGE', JSON.stringify({
        type: 'RATINGS_AVERAGE',
        postId,
        average: rating?.average,
    }));

    redisClients.redis.set(`RATINGS_AV:${postId}`, `${rating?.average}`);
}

export const addCommentHandler: AddCommentHandlerType = async (ws, postId, commentId, commentText) => {
    const sessionId = ws.data.cookies.sessionId;

    await addComment(sessionId, postId, commentId, commentText);

    redisClients.pub.publish('COMMENTS', JSON.stringify({
        type: 'COMMENTS',
        postId,
        commentId,
        commentText,
    }));
}

export const upvoteCommentHandler: UpvoteCommentHandlerType = async (ws, postId, commentId) => {
    console.log('UPVOTE_COMMENT', postId, commentId);

    const sessionId = ws.data.cookies.sessionId;

    await upvoteComment(sessionId, postId, commentId);
}

export const downvoteCommentHandler: DownvoteCommentHandlerType = async (ws, postId, commentId) => {
    console.log('DOWNVOTE_COMMENT', postId, commentId);

    const sessionId = ws.data.cookies.sessionId;

    await downvoteComment(sessionId, postId, commentId);
}
