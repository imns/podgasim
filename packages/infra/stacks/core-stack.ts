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
        const slackEventFn = new NodejsFunction(this, "slack-events-handler", {
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

        // Lambda Func Integration
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
        const bus = new events.EventBus(this, "EventBus", {});
        const slackRule = new events.Rule(this, "slackRule", {
            eventBus: bus,
            description: "Event Rule For Slack Link Shared Events",
            eventPattern: {}
        });

        const slackMsgFn = new NodejsFunction(this, "slack-msg-handler", {
            entry: path.resolve(
                path.dirname(__filename),
                "../functions/slack-message/index.ts"
            ),
            handler: "handler"
        });

        slackRule.addTarget(new eventsTargets.LambdaFunction(slackMsgFn));
    }

    setupDynamoDB() {}
}
