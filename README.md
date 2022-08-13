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

## Install CloudWatch agent

Documentation https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/download-cloudwatch-agent-commandline.html

Copy configuration file `src/amazon-cloudwatch-agent.json` to the server's folder `/opt/aws/amazon-cloudwatch-agent/`.

Check agent status on the server with `sudo service amazon-cloudwatch-agent status`.

And my answer on StackOverflow about how to parse time from the logs:
https://stackoverflow.com/questions/71148794/when-logging-to-cloudwatch-logs-in-a-json-format-what-is-the-name-of-the-timesta/73242108#73242108

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

### Parameters for tcpdump to show incoming HTTP headers 

```shell
tcpdump -A -s 0 'tcp dst port 2369 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'
```
