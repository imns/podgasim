import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export async function handler(
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
    console.log(JSON.stringify(event, null, 2));
    try {
        const eventData = JSON.parse(event.body!);
        console.log("///// EVENT BODY /////");
        console.log(JSON.stringify(eventData, null, 2));

        console.log(`EVENT TYPE: ${eventData.type!}`);
        if (eventData?.type === "url_verification") {
            return {
                body: JSON.stringify({
                    challenge: eventData.challenge
                }),
                statusCode: 200
            };
        }

        if (eventData?.type === "event_callback") {
            console.log(`API EVENT TYPE: ${eventData.event.type!}`);
            return {
                body: "",
                statusCode: 200
            };
        }

        // Some other kind of event
        throw new Error("Unknow Event Typed");
    } catch (e) {
        console.error(e);
        return {
            body: "internal server error",
            statusCode: 500
        };
    }
}
