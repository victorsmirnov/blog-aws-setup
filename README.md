# Infrastructure for victorsmirnov.blog

The project builds AWS cloud for personal blog website.

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
