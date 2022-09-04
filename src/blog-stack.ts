import { Environment, Stack } from 'aws-cdk-lib'
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import { PublicHostedZone, TxtRecord } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { createCloudFront } from './cloud-front.js'
import { createCloudFrontDns } from './cloud-front-dns.js'
import { createLoadBalancer } from './load-balancer.js'
import { createDashboard } from './monitoring.js'
import { createVpc } from './vpc.js'
import { createWebsiteBucket } from './website-bucket.js'
import { createWebServer } from './web-server.js'

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
   * Site verification for Google Analytics.
   */
  readonly googleVerify: string

  /**
   * VPC CIDR. We assume the CIDR size to equal 16. Subnets CIDR mask is 20 and we leave 4 bits for subnet numbers.
   * For example, "10.100.0.0/16"
   */
  readonly vpcCidr: string
}

/**
 * Define blog stack.
 */
export function createBlogStack (scope: Construct, props: BlogStackProps): Stack {
  const { domainName, env, googleVerify, vpcCidr } = props

  const stack = new Stack(scope, 'BlogStack', { env })

  const hostedZone = new PublicHostedZone(stack, 'HostedZone', { zoneName: domainName })

  // eslint-disable-next-line no-new
  new TxtRecord(stack, 'GoogleVerification', { values: [googleVerify], zone: hostedZone })

  const vpc = createVpc(stack, { vpcCidr })

  const accessIdentity = new OriginAccessIdentity(stack, 'CloudfrontAccess')

  const siteBucket = createWebsiteBucket(stack, { accessIdentity, bucketName: props.domainName })

  const webServer = createWebServer(stack, { vpc })

  const loadBalancer = createLoadBalancer(stack, { domainName, hostedZone, vpc, webServer, webServerPort: 2369 })

  const cloudFront = createCloudFront(stack, { accessIdentity, domainName, hostedZone, loadBalancer, siteBucket })

  createCloudFrontDns(stack, { cloudFront, hostedZone })

  createDashboard(stack, { distributionId: cloudFront.distributionId, loadBalancer, webServer })

  return stack
}
