import { clients } from "./store";
import {
    BroadcastOnCloseType,
    BroadcastOnOpenType,
    BroadcastOnPostRatingChangeType,
} from "./types";

export const broadcastOnPostRatingChange: BroadcastOnPostRatingChangeType = (message) => {
    const decodedMessage = JSON.parse(message);
    const postId = decodedMessage.postId;

    console.log(`Broadcasting on post rating change for post ${postId}`);

    clients.forEach((client) => {
        console.log(client);

        if (client.data.currentPageId !== postId) {
            return;
        }

        client.send(message);
    });
}

export const broadcastOnClose: BroadcastOnCloseType = () => {
    clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'CLIENTS_COUNT',
            count: clients.size,
        }));
    });
};

export const broadcastOnOpen: BroadcastOnOpenType = () => {
    clients.forEach(client => {
        client.send(JSON.stringify({
            type: 'CLIENTS_COUNT',
            count: clients.size,
        }));
    });
};
