import axios from "axios";

// https://api.slack.com/methods/chat.postMessage
type CreateMessageResponse = {
    ok: boolean;
    channel: string;
};

export async function handler(event: any) {
    console.log(JSON.stringify(event, null, 2));
    // const { data } = await axios.post<CreateMessageResponse>(
    //     'https://reqres.in/api/users',
    //     { token: 'John Smith', channel: 'manager' },
    //     {
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Accept: 'application/json',
    //       },
    //     },
    //   );
}
