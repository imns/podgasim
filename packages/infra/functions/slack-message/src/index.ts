import axios from "axios";

// https://api.slack.com/methods/chat.postMessage
type CreateMessageResponse = {
    ok: boolean;
    channel: string;
};

export async function handler(event: any) {
    console.log(JSON.stringify(event, null, 2));
    try {
        const { token, channel } = event;
        const { data } = await axios.post(
            "https://reqres.in/api/users",
            {
                token: token,
                channel: channel,
                text: "Yo Dawg, you like podcasts?",
                unfurl_links: true,
                unfurl_media: true
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                }
            }
        );
        console.log("slack response data:");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
        throw e;
    }
}
