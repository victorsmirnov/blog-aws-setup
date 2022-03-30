#!/usr/bin/env node
import {App} from "@aws-cdk/core";
import {BlogStack} from "./BlogStack.js";
import {env} from "process";
import Joi from "joi";

validateEnvironment();

const app = new App();
new BlogStack(app, {
    domainName: env.DOMAIN_NAME,
    env: {account: env.AWS_ACCOUNT, region: env.AWS_REGION},
    googleVerify: env.GOOGLE_VERIFY,
    vpcCidr: env.VPC_CIDR,
});

/**
 * Validate environment variable. Print an error message and throws an exception in case of failure.
 */
function validateEnvironment() {
    const envSchema = Joi.object({
        AWS_ACCOUNT: Joi.string().required(),

        AWS_REGION: Joi.string().required(),

        DOMAIN_NAME: Joi.string().required(),

        GOOGLE_VERIFY: Joi.string(),

        VPC_CIDR: Joi.string().required(),
    }).unknown(true);

    const validationRes = envSchema.validate(env);
    if (validationRes.error) {
        console.log(validationRes.error.annotate());
        throw validationRes.error;
    }
}
