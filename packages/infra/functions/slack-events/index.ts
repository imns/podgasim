import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  console.log(JSON.stringify(event, null, 2));

  return {
    body: JSON.stringify({ message: "Successful lambda invocation" }),
    statusCode: 200,
  };
}
