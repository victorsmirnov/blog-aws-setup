import { createVpc } from './Vpc.js'
import { createAuroraCluster } from './AuroraCluster.js'
import { createWebServer } from './WebServer.js'
import { createLoadBalancer } from './LoadBalancer.js'
import { createCloudFrontDist } from './CloudFrontDist.js'
import { createDashboard } from './Monitoring.js'
import { CfnParameter, Environment, Stack } from 'aws-cdk-lib'
import { ARecord, PublicHostedZone, RecordTarget, TxtRecord } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'

export interface BlogStackProps {
  /**
   * Blog domain name.
   */
  readonly domainName: string

  /**
   * AWS environment where we deploy our stack.
   */
  readonly env: Environment

  /**
   * VPC CIDR. We assume the CIDR size to equal 16. Subnets CIDR mask is 20 and we leave 4 bits for subnet numbers.
   * For example, "10.100.0.0/16"
   */
  readonly vpcCidr: string
}

/**
 * Define blog stack.
 */
export function createBlogStack (scope: Construct, { domainName, env, vpcCidr }: BlogStackProps): Stack {
  const stack = new Stack(scope, 'BlogStack', { env })

  const googleVerify = new CfnParameter(stack, 'GoogleVerify', {
    description: 'Site verification for Google Analytics.',
    type: 'String'
  })

  const hostedZone = new PublicHostedZone(stack, 'HostedZone', {
    zoneName: domainName
  })

  // eslint-disable-next-line no-new
  new TxtRecord(stack, 'GoogleVerification', {
    values: [googleVerify.valueAsString],
    zone: hostedZone
  })

  const vpc = createVpc(stack, { cidr: vpcCidr })

  const webServer = createWebServer(stack, { vpc })

  const loadBalancer = createLoadBalancer(stack, {
    domainName,
    hostedZone,
    vpc,
    webServer
  })

  const auroraCluster = createAuroraCluster(stack, { vpc })
  auroraCluster.connections.allowDefaultPortFrom(webServer, 'Allow web server access')

  const cloudFrontDist = createCloudFrontDist(stack, {
    albDomainName: loadBalancer.loadBalancerDnsName,
    domainName,
    hostedZone
  })

  // eslint-disable-next-line no-new
  new ARecord(stack, 'WebServerARecord', {
    target: RecordTarget.fromAlias(
      new CloudFrontTarget(cloudFrontDist)
    ),
    zone: hostedZone
  })

  createDashboard(stack, { cloudFrontDist, loadBalancer, webServer })

  return stack
}
