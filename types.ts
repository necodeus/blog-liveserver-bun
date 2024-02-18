export type BroadcastOnPostRatingChangeType = (message: string) => void;
export type BroadcastOnCloseType = () => void;
export type BroadcastOnOpenType = () => void;

export type SubscriberErrorHandlerType = (error: any) => void;
export type RatingsAverageHandlerType  = (error: any) => void;

export type SubscriberMessageHandlerType = (channel: string, message: string) => void;

export type GetPostCommentHandlerType   = (ws: WebSocketWithData, postId: string) => Promise<void>;
export type UpdatePostRatingHandlerType = (ws: WebSocketWithData, postId: string, value: number) => Promise<void>;
export type GetPostRatingHandlerType    = (ws: WebSocketWithData, postId: string) => Promise<void>;
export type AddCommentHandlerType       = (ws: WebSocketWithData, postId: string, commentId: string, commentText: string) => Promise<void>;
export type UpvoteCommentHandlerType    = (ws: WebSocketWithData, postId: string, commentId: string) => Promise<void>;
export type DownvoteCommentHandlerType  = (ws: WebSocketWithData, postId: string, commentId: string) => Promise<void>;

export type WebSocketWithData = WebSocket & {
    data: {
        cookies: {
            sessionId: string
        },
        previousPageId: string,
        currentPageId: string,
    },
};

export interface DebugHTTPServer {
    upgrade(req: Request, options: {
        data: {
            cookies?: {
                [key: string]: string
            },
            previousPageId?: string,
            currentPageId?: string,
        },
    }): boolean;
}

export interface BunType {
    serve(options: {
        fetch: (req: Request, server: DebugHTTPServer) => Response | Promise<Response>;
        hostname?: string;
        port?: number;
        development?: boolean;
        error?: (error: Error) => Response | Promise<Response>;
        tls?: {
            key?: string,
            cert?: string,
            ca?: string,
            passphrase?: string;
            dhParamsFile?: string;
        };
        maxRequestBodySize?: number;
        lowMemoryMode?: boolean;
    }): Server;
}

interface Server {
    development: boolean;
    hostname: string;
    port: number;
    pendingRequests: number;
    stop(): void;
}
