import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ARecord, RecordTarget, HostedZone } from "aws-cdk-lib/aws-route53";
import {
    DnsValidatedCertificate,
    CertificateValidation
} from "aws-cdk-lib/aws-certificatemanager";
import { ApiGatewayv2DomainProperties } from "aws-cdk-lib/aws-route53-targets";
import { DomainName } from "@aws-cdk/aws-apigatewayv2-alpha";

interface DNSStackProps extends StackProps {
    domain: string;
    hostedZoneId: string;
}

export class DNSStack extends Stack {
    dn: DomainName;
    certificate: DnsValidatedCertificate;

    constructor(scope: Construct, id: string, props: DNSStackProps) {
        super(scope, id, props);

        // const hostedZone = new HostedZone(this, "HostedZone", {
        //     zoneName: domain
        // });

        const domain = props.domain;
        const hostedZoneId = props.hostedZoneId;

        console.info(`Setting up HostedZone for domain domain name: ${domain}`);
        const hostedZone = HostedZone.fromHostedZoneAttributes(
            this,
            "HostedZone",
            {
                zoneName: domain,
                hostedZoneId: hostedZoneId
            }
        );

        console.info(
            `Setting up Certificate for domain domain name: ${domain}`
        );
        this.certificate = new DnsValidatedCertificate(this, "Certificate", {
            domainName: domain,
            subjectAlternativeNames: [`*.${domain}`],
            hostedZone: hostedZone,
            validation: CertificateValidation.fromDns(hostedZone),
            region: "us-east-2"
        });

        this.dn = new DomainName(this, "APIDomainName", {
            domainName: domain,
            certificate: this.certificate
        });

        // Root Apex Record
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
}
