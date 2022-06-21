#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PodgasimStack } from "../stacks/podgasim-stack";

import "dotenv/config";

const app = new cdk.App();
new PodgasimStack(app, "PodgasimStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domain: process.env.DOMAIN_NAME || "",
});
