import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { Distribution } from 'aws-cdk-lib/aws-cloudfront'
import { Construct } from 'constructs'

export interface CloudFrontDnsProps {
  readonly cloudFront: Distribution
  readonly hostedZone: PublicHostedZone
}

export function createCloudFrontDns (scope: Construct, { cloudFront, hostedZone }: CloudFrontDnsProps): ARecord {
  return new ARecord(scope, 'WebServerARecord', {
    target: RecordTarget.fromAlias(new CloudFrontTarget(cloudFront)),
    zone: hostedZone
  })
}
