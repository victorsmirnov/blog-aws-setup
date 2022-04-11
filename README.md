[![License](https://badgen.net/github/license/victorsmirnov/blog-aws-setup?color=purple)](https://github.com/victorsmirnov/blog-aws-setup/blob/master/LICENSE.md)
[![TS-Standard - Typescript Standard Style Guide](https://badgen.net/badge/code%20style/ts-standard/blue?color=purple&icon=typescript)](https://github.com/standard/ts-standard)
[![Dependabot badge](https://badgen.net/github/dependabot/victorsmirnov/blog-aws-setup?color=purple&icon=dependabot)](https://dependabot.com/)

# The AWS Cloud infrastructure for the [victorsmirnov.blog](https://victorsmirnov.blog) blog

The AWS CDK project to build the AWS infrastructure for the personal blog project.

## Notes

* [Why we do not have tests.](https://victorsmirnov.blog/should-we-test-aws-cdk-code/)

## Environment variables

Project depends on the following environment variables.

 * `AWS_ACCOUNT` AWS account number.
 * `AWS_REGION` AWS region.
 * `DOMAIN_NAME` Blog domain name.
 * `GOOGLE_VERIFY` Google verification code for DNS site verification.
 * `VPC_CIDR` VPC CIDR. We assume CIDR size of 16. For example, "10.100.0.0/16".


## Useful commands

 * `npm run build` compile typescript to js.
 * `npm run watch` watch for changes and compile.
 * `cdk --profile <name> diff` compare deployed stack with current state.
 * `cdk --profile <name> deploy --no-execute` create change.
 * `cdk --profile <name> deploy` deploy the stack.
