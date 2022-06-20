/* 
  TODO:
    - Sort out the A records, domain, certs, hosted zone, dns stuff
    - Create the lambda Funcs
    - Setup AWS Vault
    - Integrate dotenv somehow ... or something similar
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
} from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  PublicHostedZone,
  ZoneDelegationRecord,
  ARecord,
  RecordTarget,
  HostedZone,
} from "aws-cdk-lib/aws-route53";
import {
  DnsValidatedCertificate,
  Certificate,
  ValidationMethod,
} from "aws-cdk-lib/aws-certificatemanager";
import { ApiGateway } from "aws-cdk-lib/aws-route53-targets";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
// import { LambdaRestApi, HttpIntegration } from "aws-cdk-lib/aws-apigateway";

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
interface DNSStackProps extends NestedStackProps {
  domain: string;
}
export class DNSStack extends NestedStack {
  dn: DomainName;

  constructor(scope: Construct, id: string, props: DNSStackProps) {
    super(scope, id, props);

    const domain = props.domain;

    // as above we create a hostedzone for the subdomain
    const hostedZone = new PublicHostedZone(this, "PublicHostedZone", {
      zoneName: domain,
    });
    // add a ZoneDelegationRecord so that requests for *.picture.bahr.dev
    // and picture.bahr.dev are handled by our newly created HostedZone
    const nameServers: string[] = hostedZone.hostedZoneNameServers!;
    // const rootZone = PublicHostedZone.fromLookup(this, "Zone", {
    //   domainName: domain,
    // });
    new ZoneDelegationRecord(this, "Delegation", {
      recordName: domain,
      nameServers,
      zone: hostedZone,
      ttl: Duration.minutes(1),
    });

    const certificate = new DnsValidatedCertificate(this, "Certificate", {
      region: "us-east-1",
      hostedZone: hostedZone,
      domainName: domain,
      subjectAlternativeNames: [`*.${domain}`],
      // validationDomains: {
      //   [this.domain]: this.domain,
      //   [`*.${this.domain}`]: this.domain,
      // },
      // validationMethod: ValidationMethod.DNS,
    });

    // new ARecord(this, "AliasRecord", {
    //   recordName: domain,
    //   zone: hostedZone,
    //   target: RecordTarget.fromAlias(new ApiGateway(restApi)),
    // });

    this.dn = new DomainName(this, "DN", {
      domainName: domain,
      certificate: certificate,
    });
  }
}

// declare const dn: DomainName;
// declare const eventtFn: NodejsFunction;

interface CDKContext {
  appName: string;
  region: string;
  environment: string;
  branchName: string;
  accountNumber: string;
  baseDomain: string;
  apiDomain: string;
  hostedZoneId: string;
  regionalCertArn: string;
}

interface APIStackProps extends NestedStackProps {
  dn: DomainName;
}
class APIStack extends NestedStack {
  constructor(scope: Construct, id: string, props: APIStackProps) {
    super(scope, id, props);

    const httpApi = new HttpApi(this, "HttpApi", {
      defaultDomainMapping: {
        domainName: props.dn,
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
        "../functions/slack-events/index.ts"
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

interface PodgasimStackProps extends StackProps {
  domain: string;
}

export class PodgasimStack extends Stack {
  constructor(scope: Construct, id: string, props: PodgasimStackProps) {
    super(scope, id, props);

    const { dn } = new DNSStack(this, "dns-stack", { domain: props.domain });
    new APIStack(this, "api-stack", { dn });

    // new CfnOutput(this, "APIURL", {
    //   value: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/pets`,
    // });
  }
}
