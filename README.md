[![License](https://badgen.net/github/license/victorsmirnov/blog-aws-setup)](https://github.com/victorsmirnov/blog-aws-setup/blob/master/LICENSE.md)
[![TS-Standard - Typescript Standard Style Guide](https://badgen.net/badge/code%20style/ts-standard?icon=typescript)](https://github.com/standard/ts-standard)

# The AWS Cloud infrastructure for the [victorsmirnov.blog](https://victorsmirnov.blog)

The AWS CDK project to build the AWS infrastructure for the personal blog project.

## Notes

* [Why we do not have tests.](https://victorsmirnov.blog/should-we-test-aws-cdk-code/)

## Useful commands

 * `npm run build` compile typescript to js.
 * `npm run build:watch` watch for changes and compile.
 * `cdk --profile <name> diff` compare deployed stack with current state.
 * `cdk --profile <name> deploy --no-execute` create change.
 * `cdk --profile <name> deploy` deploy the stack.

## Server and client certificates

```shell
./easyrsa init-pki

./easyrsa build-ca nopass

./easyrsa build-server-full server nopass

aws --profile <name> acm import-certificate --certificate fileb://easyrsa3/pki/issued/server.crt \
    --private-key fileb://easyrsa3/pki/private/server.key \
    --certificate-chain fileb://easyrsa3/pki/ca.crt

./easyrsa build-client-full <email-address> nopass

```
