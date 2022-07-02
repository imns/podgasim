import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { EventBridge } from "aws-sdk";

const eventBridge = new EventBridge();

const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;
const EVENT_BUS_SOURCE = process.env.EVENT_BUS_SOURCE;

export async function handler(
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
    // console.log(JSON.stringify(event, null, 2));
    try {
        const eventData = JSON.parse(event.body!);
        console.log("///// EVENT BODY /////");
        console.log(JSON.stringify(eventData, null, 2));

        console.log(`EVENT TYPE: ${eventData.type!}`);
        if (eventData?.type === "url_verification") {
            return {
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    challenge: eventData.challenge
                }),
                statusCode: 200
            };
        }

        if (eventData?.type === "event_callback") {
            console.log(`API EVENT TYPE: ${eventData.event.type!}`);

            // send to event bridge
            await putEvent(eventData);
            console.log("Added event data to event bus");

            return {
                headers: {
                    "Content-Type": "text/html"
                },
                body: "success",
                statusCode: 200
            };
        }

        // Some other kind of event
        throw new Error("Unknow Event Typed");
    } catch (e) {
        console.error(e);
        return {
            headers: {
                "Content-Type": "text/html"
            },
            body: "internal server error",
            statusCode: 500
        };
    }
}

async function putEvent(event: any) {
    try {
        // BIG TODO
        const params = {
            Entries: [
                {
                    DetailType: "Slack Event",
                    EventBusName: EVENT_BUS_NAME,
                    Source: EVENT_BUS_SOURCE,
                    Time: new Date(),
                    // Main event body
                    Detail: JSON.stringify(event)
                }
            ]
        };

        console.log("Params for eventBridge.putEvents:");
        console.log(params);
        const result = await eventBridge.putEvents(params).promise();
        console.log("Results of eventBridge.putEvents: ");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.log("ERROR in putEvent()");
        throw e;
    }
}
