/* 
  TODO:
    - Decide on a naming convention
    - Pass in variables and name everything
    - Bootstrap the CDK
    - Try to deploy once
    - Set the nameservers on hover
    - Setup Pipeline deploy with Github actions
*/

import * as path from "path";

import {
    Stack,
    StackProps,
    NestedStack,
    NestedStackProps,
    Duration,
    CfnOutput,
    RemovalPolicy
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
    PublicHostedZone,
    ZoneDelegationRecord,
    ARecord,
    RecordTarget,
    HostedZone
} from "aws-cdk-lib/aws-route53";
import {
    Certificate,
    DnsValidatedCertificate,
    CertificateValidation
} from "aws-cdk-lib/aws-certificatemanager";
import { ApiGatewayv2DomainProperties } from "aws-cdk-lib/aws-route53-targets";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// import { LambdaRestApi, HttpIntegration } from "aws-cdk-lib/aws-apigateway";

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import {
    CorsHttpMethod,
    HttpApi,
    HttpMethod,
    DomainName as HTTPAPIDomainName
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

// DNS
// https://dev.to/aws-builders/automate-building-a-unique-domain-hosting-environment-with-aws-cdk-1dd1

// THIS IS IT NATE: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html#custom-domains
// interface DNSStackProps extends NestedStackProps {
//   domain: string;
// }
// export class DNSStack extends NestedStack {
//   constructor(scope: Construct, id: string, props: DNSStackProps) {
//     super(scope, id, props);

//     const domain = props.domain;
//   }
// }

// declare const dn: DomainName;
// declare const eventtFn: NodejsFunction;

// interface CDKContext {
//   appName: string;
//   region: string;
//   environment: string;
//   branchName: string;
//   accountNumber: string;
//   baseDomain: string;
//   apiDomain: string;
//   hostedZoneId: string;
//   regionalCertArn: string;
// }

interface APIStackProps extends NestedStackProps {
    domain: string;
}
// class APIStack extends NestedStack {
//   apiURL: string;

//   constructor(scope: Construct, id: string, props: APIStackProps) {
//     super(scope, id, props);

///////////////////////////////
// Part 1
// const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
//   domainName: props.domain,
// });

// const apiCert = new DnsValidatedCertificate(this, "ApiSSL", {
//   domainName: props.domain,
//   hostedZone,
//   validation: CertificateValidation.fromDns(hostedZone),
//   region: "us-east-1",
// });

///////////////////////////////
// Part 2
// const dn = new DomainName(this, "api_domain", {
//   domainName: props.domain,
//   certificate: apiCert,
// });

// const httpApi = new HttpApi(this, "HttpApi", {
//   defaultDomainMapping: {
//     domainName: dn,
//   },
//   createDefaultStage: true,
//   corsPreflight: {
//     allowHeaders: ["Content-Type", "Authorization"],
//     allowMethods: [
//       CorsHttpMethod.GET,
//       CorsHttpMethod.HEAD,
//       CorsHttpMethod.OPTIONS,
//       CorsHttpMethod.POST,
//     ],
//     allowOrigins: ["*"],
//     maxAge: Duration.days(10),
//   },
// });

// httpApi.applyRemovalPolicy(RemovalPolicy.DESTROY);

// this.apiURL = httpApi.url!;

// // lambda integration
// const eventtFn = new NodejsFunction(this, "hello-function", {
//   entry: path.resolve(
//     path.dirname(__filename),
//     "../functions/slack-events/index.ts"
//   ),
//   handler: "handler",
// });

// new ARecord(this, "HttpApiAliasRecord", {
//   zone: hostedZone,
//   target: RecordTarget.fromAlias(
//     // >> Error happens here
//     new ApiGatewayv2DomainProperties(
//       dn.regionalDomainName,
//       dn.regionalHostedZoneId
//     )
//   ),
// });

// // Lambda Func Integration
// const eventIntegration = new HttpLambdaIntegration(
//   "EventIntegration",
//   eventtFn
// );

// httpApi.addRoutes({
//   path: "/events",
//   methods: [HttpMethod.GET],
//   integration: eventIntegration,
// });

// // ///////////////////////////////
// // // Part 3
// // new ARecord(this, "apiAliasRecord", {
// //   zone: hostedZone,
// //   target: RecordTarget.fromAlias(
// //     new ApiGatewayv2DomainProperties(
// //       dn.regionalDomainName,
// //       dn.regionalHostedZoneId
// //     )
//   ),
// });

// CLOUDFRONT
// const feCf = new CloudFrontWebDistribution(this, "MyCf", {
//   defaultRootObject: "/",
//   originConfigs: [
//     {
//       customOriginSource: {
//         domainName: `${httpApi.httpApiId}.execute-api.${this.region}.${this.urlSuffix}`,
//       },
//       behaviors: [
//         {
//           isDefaultBehavior: true,
//         },
//       ],
//     },
//   ],
//   enableIpV6: true,
// });

// new cdk.CfnOutput(this, "myOut", {
//   value: feCf.distributionDomainName,
// });
// }
// }

interface PodgasimStackProps extends StackProps {
    domain: string;
}

export class PodgasimStack extends Stack {
    dn: HTTPAPIDomainName;
    apiURL: string;

    constructor(scope: Construct, id: string, props: PodgasimStackProps) {
        super(scope, id, props);

        this.setupDNS(props.domain);
        this.setupAPI();

        new CfnOutput(this, "APIURL", {
            value: this.apiURL
        });
    }

    setupDNS(domain: string) {
        // const hostedZone = new HostedZone(this, "HostedZone", {
        //     zoneName: domain
        // });

        // SUBDOMAIN //////
        const subdomain = `api.${domain}`;

        console.info(`Setting up HostedZone for domain domain name: ${domain}`);
        const hostedZone = HostedZone.fromHostedZoneAttributes(
            this,
            "HostedZone",
            {
                zoneName: domain,
                hostedZoneId: process.env.HOSTED_ZONE_ID!
            }
        );

        console.info(
            `Setting up Certificate for domain domain name: ${domain} and subdomain: ${subdomain}`
        );
        const certificate = new DnsValidatedCertificate(this, "Certificate", {
            domainName: domain,
            subjectAlternativeNames: [`*.${domain}`],
            hostedZone: hostedZone,
            validation: CertificateValidation.fromDns(hostedZone),
            region: "us-east-2"
        });
        // certificate.applyRemovalPolicy(RemovalPolicy.DESTROY);

        this.dn = new HTTPAPIDomainName(this, "APIDomainName", {
            domainName: subdomain,
            certificate: certificate
        });

        new ARecord(this, "HttpApiAliasRecord", {
            zone: hostedZone,
            recordName: domain,
            target: RecordTarget.fromAlias(
                new ApiGatewayv2DomainProperties(
                    this.dn.regionalDomainName,
                    this.dn.regionalHostedZoneId
                )
            )
        });

        // Wildcard A Record
        new ARecord(this, "HttpWildcardApiAliasRecord", {
            zone: hostedZone,
            recordName: `*.${domain}`,
            target: RecordTarget.fromAlias(
                new ApiGatewayv2DomainProperties(
                    this.dn.regionalDomainName,
                    this.dn.regionalHostedZoneId
                )
            )
        });
    }
    setupAPI() {
        const httpApi = new HttpApi(this, "HttpApi", {
            defaultDomainMapping: {
                domainName: this.dn
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

        // httpApi.applyRemovalPolicy(RemovalPolicy.DESTROY);

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
    }
}
