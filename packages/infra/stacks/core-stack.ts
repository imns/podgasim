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

interface CoreStacktackProps extends StackProps {
    domainName: DomainName;
}

export class CoreStack extends Stack {
    apiURL: string;

    constructor(scope: Construct, id: string, props: CoreStacktackProps) {
        super(scope, id, props);

        const domainNameConstruct = props.domainName;

        this.setupAPI(domainNameConstruct);
        this.setupEventBus();
        this.setupDynamoDB();
    }

    setupAPI(domainNameConstruct: DomainName) {
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
        const slackEventFn = new NodejsFunction(this, "SlackEventsHandler", {
            entry: path.resolve(
                path.dirname(__filename),
                "../functions/slack-events/index.ts"
            ),
            handler: "handler"
        });

        // We need to give your lambda permission to put events on our EventBridge
        let eventPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            resources: ["*"],
            actions: ["events:PutEvents"]
        });
        slackEventFn.addToRolePolicy(eventPolicy);

        // Lambda Func Integration for the HTTP API
        const eventIntegration = new HttpLambdaIntegration(
            "EventIntegration",
            slackEventFn
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
    }

    setupEventBus() {
        // Reverse the Domain Name, like a Java Package (I feel gross about it too)
        const EVENT_BUS_SOURCE = process.env
            .DOMAIN_NAME!.split(".")
            .reverse()
            .join(".");

        const bus = new events.EventBus(this, "EventBus", {});
        const slackRule = new events.Rule(this, "SlackEventRule", {
            eventBus: bus,
            description: "Event Rule For Slack Link Shared Events",
            eventPattern: {
                source: [EVENT_BUS_SOURCE]
            }
        });

        const slackMsgFn = new NodejsFunction(this, "SlackMsgHandler", {
            entry: path.resolve(
                path.dirname(__filename),
                "../functions/slack-message/src/index.ts"
            ),
            handler: "handler",
            environment: {
                EVENT_BUS_NAME: bus.eventBusName,
                EVENT_BUS_SOURCE: EVENT_BUS_SOURCE
            }
        });

        slackRule.addTarget(new eventsTargets.LambdaFunction(slackMsgFn));
    }

    setupDynamoDB() {}
}
