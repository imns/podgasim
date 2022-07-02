import axios from "axios";

// https://api.slack.com/methods/chat.postMessage
// interface CreateMessageResponse = {
//     ok: boolean;
//     channel: string;
// };

interface EventBus {}

interface SlackEvent {}

export async function handler(event: any) {
    console.log(JSON.stringify(event, null, 2));
    try {
        const { token, event: linkEvent, api_app_id, team_id } = event.detail;
        const { channel, links } = linkEvent;

        console.log("Links:");
        console.log(JSON.stringify(links, null, 2));

        const { data } = await axios.post(
            "https://slack.com/api/chat.postMessage",
            {
                token: token,
                channel: channel,
                text: "Yo Dawg, you like podcasts?",
                unfurl_links: true,
                unfurl_media: true
            },
            {
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    Authorization: `Bearer 0afec80f8d84c8d629fffa112c666c18`
                    // Accept: "application/json"
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
