import * as path from "path";
import { Stack, StackProps, Duration, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
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
        const eventtFn = new NodejsFunction(this, "hello-function", {
            entry: path.resolve(
                path.dirname(__filename),
                "../functions/slack-events/index.ts"
            ),
            handler: "handler"
        });

        // Lambda Func Integration
        const eventIntegration = new HttpLambdaIntegration(
            "EventIntegration",
            eventtFn
        );

        httpApi.addRoutes({
            path: "/events",
            methods: [HttpMethod.GET],
            integration: eventIntegration
        });

        new CfnOutput(this, "APIURL", {
            value: this.apiURL
        });
    }
}
