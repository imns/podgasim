import { Stack, StackProps, Duration } from "aws-cdk-lib";
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

// DNS
// https://dev.to/aws-builders/automate-building-a-unique-domain-hosting-environment-with-aws-cdk-1dd1

// THIS IS IT NATE: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway-readme.html#custom-domains
export class DNSStack extends Stack {
  domain: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
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

export class PodgasimStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'PodgasimQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
