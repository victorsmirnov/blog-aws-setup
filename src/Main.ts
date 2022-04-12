#!/usr/bin/env node
import { createBlogStack } from './BlogStack.js'
import { env } from 'process'
import Joi from 'joi'
import { App } from 'aws-cdk-lib'

validateEnvironment()

const app = new App()
createBlogStack(app, {
  domainName: 'victorsmirnov.blog',
  env: { account: env.CDK_DEFAULT_ACCOUNT, region: env.CDK_DEFAULT_REGION },
  vpcCidr: '10.100.0.0/16'
})

/**
 * Validate environment variable. Print an error message and throws an exception in case of failure.
 */
function validateEnvironment (): void {
  const envSchema = Joi.object({
    CDK_DEFAULT_ACCOUNT: Joi.string().required(),

    CDK_DEFAULT_REGION: Joi.string().required()
  }).unknown(true)

  const validationRes = envSchema.validate(env)
  if (validationRes.error != null) {
    console.log(validationRes.error.annotate())
    throw validationRes.error
  }
}
