import { BLOG_API_URL } from "../config";

export async function saveRating(sessionId: string, postId: string, value: number) {
    try {
        // TODO: Remove sessionId from body
        const data = await fetch(`${BLOG_API_URL}/api/v1/posts/${postId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // TODO: Use application/json
                'Cookie': `sessionId=${sessionId}`,
            },
            body: `value=${value}&sessionId=${sessionId}`,
        }).then(res => res.json());

        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getComments(sessionId: string, postId: string) {
    try {
        // TODO: Remove sessionId from query
        const data = await fetch(`${BLOG_API_URL}/api/v1/posts/${postId}/comments?sessionId=${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // TODO: Use application/json
                'Cookie': `sessionId=${sessionId}`,
            },
        }).then(res => res.json());

        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function addComment(sessionId: string, postId: string, commentId: string, commentText: string) {
    try {
        const data = await fetch(`${BLOG_API_URL}/api/v1/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `sessionId=${sessionId}`,
            },
            body: JSON.stringify({
                commentId,
                commentText,
            }),
        }).then(res => res.json());

        console.log('ADD_COMMENT', { sessionId, postId, commentId, commentText, data });

        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function upvoteComment(sessionId: string, postId: string, commentId: string) {
    console.log('UPVOTE_COMMENT', { sessionId, postId, commentId });

    try {
        const data = await fetch(`${BLOG_API_URL}/api/v1/posts/${postId}/comments/${commentId}/upvote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `sessionId=${sessionId}`,
            },
        // }).then(async (res) => {
        //     console.log('UPVOTE_COMMENT', await res.text());
        //     return res.json();
        // });
        }).then(res => res.json());

        console.log('UPVOTE_COMMENT', { sessionId, postId, commentId, data });

        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function downvoteComment(sessionId: string, postId: string, commentId: string) {
    console.log('DOWNVOTE_COMMENT', { sessionId, postId, commentId });

    try {
        const data = await fetch(`${BLOG_API_URL}/api/v1/posts/${postId}/comments/${commentId}/downvote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `sessionId=${sessionId}`,
            },
        // }).then(async (res) => {
        //     console.log('DOWNVOTE_COMMENT', await res.text());
        //     return res.json();
        // });
        }).then(res => res.json());

        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}
