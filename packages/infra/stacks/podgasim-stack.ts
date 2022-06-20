import * as path from "path";

import {
  Stack,
  StackProps,
  NestedStack,
  NestedStackProps,
  Duration,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  PublicHostedZone,
  ZoneDelegationRecord,
} from "aws-cdk-lib/aws-route53";
import {
  DnsValidatedCertificate,
  ValidationMethod,
} from "aws-cdk-lib/aws-certificatemanager";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
  DomainName,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

// DNS
// https://dev.to/aws-builders/automate-building-a-unique-domain-hosting-environment-with-aws-cdk-1dd1

// THIS IS IT NATE: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html#custom-domains
export class DNSStack extends NestedStack {
  domain: string;

  constructor(scope: Construct, id: string, props?: NestedStackProps) {
    super(scope, id, props);

    const apexDomain = "podgasim.com";
    // const domain = `picture.${apexDomain}`;
    this.domain = apexDomain;

    // as above we create a hostedzone for the subdomain
    const hostedZone = new PublicHostedZone(this, "PublicHostedZone", {
      zoneName: this.domain,
    });
    // add a ZoneDelegationRecord so that requests for *.picture.bahr.dev
    // and picture.bahr.dev are handled by our newly created HostedZone
    const nameServers: string[] = hostedZone.hostedZoneNameServers!;
    const rootZone = PublicHostedZone.fromLookup(this, "Zone", {
      domainName: apexDomain,
    });
    new ZoneDelegationRecord(this, "Delegation", {
      recordName: this.domain,
      nameServers,
      zone: rootZone,
      ttl: Duration.minutes(1),
    });

    const certificate = new DnsValidatedCertificate(this, "Certificate", {
      region: "us-east-1",
      hostedZone: hostedZone,
      domainName: this.domain,
      subjectAlternativeNames: [`*.${this.domain}`],
      // validationDomains: {
      //   [this.domain]: this.domain,
      //   [`*.${this.domain}`]: this.domain,
      // },
      // validationMethod: ValidationMethod.DNS,
    });
  }
}
declare const dn: DomainName;
declare const eventtFn: NodejsFunction;
interface APIProps extends NestedStackProps {
  domain: string;
}
class APIStack extends NestedStack {
  constructor(scope: Construct, id: string, props?: APIProps) {
    super(scope, id, props);

    const httpApi = new HttpApi(this, "HttpApi", {
      defaultDomainMapping: {
        domainName: dn,
      },
      corsPreflight: {
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.HEAD,
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.POST,
        ],
        allowOrigins: ["*"],
        maxAge: Duration.days(10),
      },
    });

    // lambda integration
    const eventtFn = new NodejsFunction(this, "hello-function", {
      entry: path.resolve(
        path.dirname(__filename),
        "../functions/determination-api/handler.ts"
      ),
      handler: "handler",
    });

    // Lambda Func Integration
    const eventIntegration = new HttpLambdaIntegration(
      "EventIntegration",
      eventtFn
    );

    httpApi.addRoutes({
      path: "/events",
      methods: [HttpMethod.GET],
      integration: eventIntegration,
    });

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
  }
}

export class PodgasimStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { domain } = new DNSStack(this, "dns-stack");
    new APIStack(this, "api-stack", { domain });

    // new CfnOutput(this, "APIURL", {
    //   value: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/pets`,
    // });
  }
}
