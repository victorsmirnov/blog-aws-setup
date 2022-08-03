import { createVpc } from './Vpc.js'
import { createAuroraCluster } from './AuroraCluster.js'
import { createWebServer } from './WebServer.js'
import { createLoadBalancer } from './LoadBalancer.js'
import { createCloudFrontDist } from './CloudFrontDist.js'
import { createDashboard } from './Monitoring.js'
import { Environment, Stack } from 'aws-cdk-lib'
import { ARecord, PublicHostedZone, RecordTarget, TxtRecord } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { Effect, OpenIdConnectPrincipal, OpenIdConnectProvider, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam'
import { createWebsiteBucket } from './WebsiteBucket.js'
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'

export interface BlogStackProps {
  /**
   * VPN certificate ARN
   */
  readonly certificateArn: string

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

  /**
   * Client VPN CIDR range.
   */
  readonly vpnCidr: string
}

/**
 * Define blog stack.
 */
export function createBlogStack (scope: Construct, props: BlogStackProps): Stack {
  const stack = new Stack(scope, 'BlogStack', { env: props.env })

  const hostedZone = new PublicHostedZone(stack, 'HostedZone', {
    zoneName: props.domainName
  })

  // eslint-disable-next-line no-new
  new TxtRecord(stack, 'GoogleVerification', {
    values: [props.googleVerify],
    zone: hostedZone
  })

  const vpc = createVpc(stack, {
    certificateArn: props.certificateArn,
    vpcCidr: props.vpcCidr,
    vpnCidr: props.vpnCidr
  })

  const siteBucket = createWebsiteBucket(stack, { bucketName: props.domainName })

  const originAccessIdentity = new OriginAccessIdentity(stack, 'CloudfrontAccess')
  const cloudfrontAccessPolicy = new PolicyStatement({
    actions: ['s3:GetObject'],
    effect: Effect.ALLOW,
    principals: [originAccessIdentity.grantPrincipal],
    resources: [siteBucket.arnForObjects('*')]
  })
  siteBucket.addToResourcePolicy(cloudfrontAccessPolicy)

  const webServer = createWebServer(stack, { vpc })

  const loadBalancer = createLoadBalancer(stack, {
    domainName: props.domainName,
    hostedZone,
    vpc,
    webServer
  })

  const auroraCluster = createAuroraCluster(stack, { vpc })
  auroraCluster.connections.allowDefaultPortFrom(webServer, 'Allow web server access')

  const cloudFrontDist = createCloudFrontDist(stack, {
    domainName: props.domainName,
    hostedZone,
    loadBalancer,
    originAccessIdentity,
    siteBucket
  })

  // eslint-disable-next-line no-new
  new ARecord(stack, 'WebServerARecord', {
    target: RecordTarget.fromAlias(
      new CloudFrontTarget(cloudFrontDist)
    ),
    zone: hostedZone
  })

  createDashboard(stack, { cloudFrontDist, loadBalancer, webServer })

  // Configure GitHub OpenID connection following
  // https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
  // CloudFormation template example:
  // https://github.com/aws-actions/configure-aws-credentials#sample-iam-role-cloudformation-template
  const provider = new OpenIdConnectProvider(stack, 'GitHubProvider', {
    clientIds: ['sts.amazonaws.com'],
    thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
    url: 'https://token.actions.githubusercontent.com'
  })

  const deploymentRole = new Role(stack, 'ThemeDeploymentRole', {
    assumedBy: new OpenIdConnectPrincipal(provider)
      .withConditions({
        StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:victorsmirnov/blog-theme:*' }
      }),
    roleName: 'ThemeDeploymentRole'
  })

  deploymentRole.addToPolicy(new PolicyStatement({
    actions: ['cloudfront:CreateInvalidation'],
    effect: Effect.ALLOW,
    resources: [`arn:aws:cloudfront::${String(props.env.account)}:distribution/${cloudFrontDist.distributionId}`]
  }))

  return stack
}
