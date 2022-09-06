#!/usr/bin/env node
import { createBlogStack } from './blog-stack.js'
import { env } from 'process'
import { App } from 'aws-cdk-lib'
import Joi from 'joi'

validateEnvironment()

const app = new App()
createBlogStack(app, {
  domainName: 'victorsmirnov.blog',
  env: { account: env.CDK_DEFAULT_ACCOUNT, region: env.CDK_DEFAULT_REGION },
  googleVerify: env.GOOGLE_VERIFY,
  vpcCidr: '10.100.0.0/16',
  zoneName: 'victorsmirnov.blog'
})

/**
 * Validate environment variable. Print an error message and throws an exception in case of failure.
 */
function validateEnvironment (): void {
  const envSchema = Joi.object({
    CDK_DEFAULT_ACCOUNT: Joi.string().required(),
    CDK_DEFAULT_REGION: Joi.string().required(),
    GOOGLE_VERIFY: Joi.string().required()
  }).unknown(true)

  const validationRes = envSchema.validate(env)
  if (validationRes.error != null) {
    throw new Error('Missing environment variables: ' +
      validationRes.error.details.map((d) => d.message).join(', '))
  }
}
