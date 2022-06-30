import * as path from "path";
import { Stack, StackProps, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as events from "aws-cdk-lib/aws-events";
import * as eventsTargets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import {
    CorsHttpMethod,
    HttpApi,
    HttpMethod,
    DomainName as HTTPAPIDomainName
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { DomainName } from "@aws-cdk/aws-apigatewayv2-alpha";

interface HTTPAPIStacktackProps extends StackProps {
    domainName: DomainName;
}

export class HTTPAPIStack extends Stack {
    apiURL: string;

    constructor(scope: Construct, id: string, props: HTTPAPIStacktackProps) {
        super(scope, id, props);

        const domainNameConstruct = props.domainName;

        const httpApi = new HttpApi(this, "HttpApi", {
            defaultDomainMapping: {
                domainName: domainNameConstruct
            },
            createDefaultStage: true,
            corsPreflight: {
                allowHeaders: ["Content-Type", "Authorization"],
                allowMethods: [
                    CorsHttpMethod.GET,
                    CorsHttpMethod.HEAD,
                    CorsHttpMethod.OPTIONS,
                    CorsHttpMethod.POST
                ],
                allowOrigins: ["*"],
                maxAge: Duration.days(10)
            }
        });

        this.apiURL = httpApi.url!;

        // lambda integration
        const eventFn = new NodejsFunction(this, "slack-events-function", {
            entry: path.resolve(
                path.dirname(__filename),
                "../functions/slack-events/index.ts"
            ),
            handler: "handler"
        });

        // Lambda Func Integration
        const eventIntegration = new HttpLambdaIntegration(
            "EventIntegration",
            eventFn
        );

        // API Routes
        httpApi.addRoutes({
            path: "/events",
            methods: [HttpMethod.POST],
            integration: eventIntegration
        });

        new CfnOutput(this, "APIURL", {
            value: this.apiURL
        });

        // EVENTS

        // We need to give your lambda permission to put events on our EventBridge
        let eventPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ["*"],
            actions: ["events:PutEvents"]
        });
        eventFn.addToRolePolicy(eventPolicy);

        const bus = new events.EventBus(this, "EventBus", {});
        const slackRule = new events.Rule(this, "slackRule", {
            eventBus: bus,
            description: "Event Rule For Slack Link Shared Events",
            eventPattern: {}
        });

        const slackMsgFn = new NodejsFunction(this, "slack-msg-function", {
            entry: path.resolve(
                path.dirname(__filename),
                "../functions/slack-message/index.ts"
            ),
            handler: "handler"
        });

        slackRule.addTarget(new eventsTargets.LambdaFunction(slackMsgFn));
    }
}
