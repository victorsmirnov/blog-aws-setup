import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { Instance } from 'aws-cdk-lib/aws-ec2'

export interface ServerDnsProps {
  readonly server: Instance
  readonly serverName: string
  readonly zone: PublicHostedZone
}

export function createServerDns (scope: Construct, { server, serverName, zone }: ServerDnsProps): ARecord {
  return new ARecord(scope, 'WebServerDns', {
    recordName: serverName,
    target: RecordTarget.fromIpAddresses(server.instancePublicIp),
    zone
  })
}
