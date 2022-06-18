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
// export class DNSStack extends NestedStack {
//   domain: string;

//   constructor(scope: Construct, id: string, props?: NestedStackProps) {
//     super(scope, id, props);

//     const apexDomain = "podgasim.com";
//     // const domain = `picture.${apexDomain}`;
//     this.domain = apexDomain;

//     // as above we create a hostedzone for the subdomain
//     const hostedZone = new PublicHostedZone(this, "PublicHostedZone", {
//       zoneName: this.domain,
//     });
//     // add a ZoneDelegationRecord so that requests for *.picture.bahr.dev
//     // and picture.bahr.dev are handled by our newly created HostedZone
//     const nameServers: string[] = hostedZone.hostedZoneNameServers!;
//     const rootZone = PublicHostedZone.fromLookup(this, "Zone", {
//       domainName: apexDomain,
//     });
//     new ZoneDelegationRecord(this, "Delegation", {
//       recordName: this.domain,
//       nameServers,
//       zone: rootZone,
//       ttl: Duration.minutes(1),
//     });

//     const certificate = new DnsValidatedCertificate(this, "Certificate", {
//       region: "us-east-1",
//       hostedZone: hostedZone,
//       domainName: this.domain,
//       subjectAlternativeNames: [`*.${this.domain}`],
//       // validationDomains: {
//       //   [this.domain]: this.domain,
//       //   [`*.${this.domain}`]: this.domain,
//       // },
//       // validationMethod: ValidationMethod.DNS,
//     });
//   }
// }

declare const dn: DomainName;
declare const eventtFn: NodejsFunction;

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

interface APIProps extends NestedStackProps {
  domain: string;
}
class APIStack extends NestedStack {
  readonly domain: string;

  constructor(scope: Construct, id: string, props?: APIProps) {
    super(scope, id, props);

    const apexDomain = "podgasim.com";
    //     // const domain = `picture.${apexDomain}`;
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

    // Define API Authorizer
    // const apiAuthorizer = new HttpLambdaAuthorizer(
    //   "apiAuthorizer",
    //   props.lambdaFunctions["api-authorizer"],
    //   {
    //     authorizerName: `${context.appName}-http-api-authorizer-${context.environment}`,
    //     responseTypes: [HttpLambdaResponseType.SIMPLE],
    //   }
    // );

    // Define Custom Domain
    const apiDomain = new DomainName(this, "apiDomain", {
      domainName: this.domain,
      certificate: certificate,
    });

    // Add Route 53 entry for Api
    new ARecord(this, "apiDNSRecord", {
      zone: HostedZone.fromHostedZoneAttributes(this, "apiHostedZone", {
        hostedZoneId: hostedZone.hostedZoneId,
        zoneName: hostedZone.zoneName,
      }),
      recordName: this.domain,
      target: RecordTarget.fromAlias(
        new ApiGatewayv2DomainProperties(
          apiDomain.regionalDomainName,
          apiDomain.regionalHostedZoneId
        )
      ),
    });

    const httpApi = new HttpApi(this, "HttpApi", {
      defaultDomainMapping: {
        domainName: dn,
      },
      corsPreflight: {
        allowHeaders: ["Authorization"],
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
  }
}

export class PodgasimStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const domain = "podgasim.com";

    // const { domain } = new DNSStack(this, "dns-stack");
    new APIStack(this, "api-stack", { domain });

    // new CfnOutput(this, "APIURL", {
    //   value: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/pets`,
    // });
  }
}
