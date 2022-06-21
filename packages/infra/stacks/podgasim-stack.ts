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
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { ApiGatewayv2DomainProperties } from "aws-cdk-lib/aws-route53-targets";
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

    console.info(`SETTING UP DNS FOR DOMAIN: ${domain}`);

    // as above we create a hostedzone for the subdomain
    // const hostedZone = new PublicHostedZone(this, "PublicHostedZone", {
    //   zoneName: domain,
    // });
    // const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
    //   domainName: domain,
    // });
    // add a ZoneDelegationRecord so that requests for *.picture.bahr.dev
    // and picture.bahr.dev are handled by our newly created HostedZone
    // const nameServers: string[] = hostedZone.hostedZoneNameServers!;
    // new ZoneDelegationRecord(this, "Delegation", {
    //   recordName: domain,
    //   nameServers,
    //   zone: hostedZone,
    //   ttl: Duration.minutes(1),
    // });

    // const certificate = new DnsValidatedCertificate(this, "Certificate", {
    //   region: "us-east-1",
    //   hostedZone: hostedZone,
    //   domainName: domain,
    //   subjectAlternativeNames: [`*.${domain}`],
    //   // validationDomains: {
    //   //   [this.domain]: this.domain,
    //   //   [`*.${this.domain}`]: this.domain,
    //   // },
    //   // validationMethod: ValidationMethod.DNS,
    // });

    // new ARecord(this, "AliasRecord", {
    //   recordName: domain,
    //   zone: hostedZone,
    //   target: RecordTarget.fromAlias(new ApiGateway(restApi)),
    // });

    // this.dn = new DomainName(this, "DN", {
    //   domainName: domain,
    //   certificate: certificate,
    // });
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
  domain: string;
}
class APIStack extends NestedStack {
  apiURL: string;

  constructor(scope: Construct, id: string, props: APIStackProps) {
    super(scope, id, props);

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

    const httpApi = new HttpApi(this, "HttpApi", {
      // defaultDomainMapping: {
      //   domainName: dn,
      // },
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

    this.apiURL = httpApi.url!;

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

    // ///////////////////////////////
    // // Part 3
    // new ARecord(this, "apiAliasRecord", {
    //   zone: hostedZone,
    //   target: RecordTarget.fromAlias(
    //     new ApiGatewayv2DomainProperties(
    //       dn.regionalDomainName,
    //       dn.regionalHostedZoneId
    //     )
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
  }
}

interface PodgasimStackProps extends StackProps {
  domain: string;
}

export class PodgasimStack extends Stack {
  constructor(scope: Construct, id: string, props: PodgasimStackProps) {
    super(scope, id, props);

    // const { dn } = new DNSStack(this, "dns-stack", { domain: props.domain });
    const { apiURL } = new APIStack(this, "api-stack", {
      domain: props.domain,
    });

    new CfnOutput(this, "APIURL", {
      value: apiURL,
    });
  }
}
