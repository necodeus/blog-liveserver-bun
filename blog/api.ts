import { BLOG_API_URL } from "../config";

export async function saveRating(sessionId: string, postId: string, value: number) {
    try {
        // TODO: Remove sessionId from body
        const data = await fetch(`${BLOG_API_URL}/api/v1/posts/${postId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
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
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `sessionId=${sessionId}`,
            },
        }).then(res => res.json());

        return data;
    } catch (error) {
        console.error(error);
        return false;
    }
}
