#!/usr/bin/env node
import "source-map-support/register";
import {App} from "@aws-cdk/core";
import {BlogStack} from "../lib/BlogStack";
import {env} from "process";

const app = new App();
new BlogStack(app, {
    domainName: env.DOMAIN_NAME,
    env: {account: env.AWS_ACCOUNT, region: env.AWS_REGION},
    googleVerify: env.GOOGLE_VERIFY,
    vpcCidr: env.VPC_CIDR,
});
