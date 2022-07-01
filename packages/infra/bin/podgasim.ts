#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DNSStack } from "../stacks/dns-stack";
import { CoreStack } from "../stacks/core-stack";

import "dotenv/config";

// Default ENV
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // region: process.env.CDK_DEFAULT_REGION
    region: "us-east-2"
};

// Helper Func to create the stack name
const stack = (name: string) =>
    `${process.env.APP_NAME}-${name}-${process.env.STAGE}`;

const app = new cdk.App();

const { dn: domainName } = new DNSStack(app, stack("DNSStack"), {
    domain: process.env.DOMAIN_NAME!,
    hostedZoneId: process.env.HOSTED_ZONE_ID!,
    env
});

new CoreStack(app, stack("CoreStack"), {
    domainName,
    env
});

app.synth();
