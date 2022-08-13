import { Environment } from 'aws-cdk-lib'
import { Distribution } from 'aws-cdk-lib/aws-cloudfront'
import { Effect, OpenIdConnectPrincipal, OpenIdConnectProvider, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export interface GitHubConnectProps {
  readonly cloudFront: Distribution
  readonly env: Environment
  readonly siteBucket: Bucket
}

export function createGitHubConnect (scope: Construct, { cloudFront, env, siteBucket }: GitHubConnectProps): void {
  // Configure GitHub OpenID connection following
  // https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
  // CloudFormation template example:
  // https://github.com/aws-actions/configure-aws-credentials#sample-iam-role-cloudformation-template
  const provider = new OpenIdConnectProvider(scope, 'GitHubProvider', {
    clientIds: ['sts.amazonaws.com'],
    thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
    url: 'https://token.actions.githubusercontent.com'
  })

  const deploymentRole = new Role(scope, 'ThemeDeploymentRole', {
    assumedBy: new OpenIdConnectPrincipal(provider)
      .withConditions({
        StringLike: { 'token.actions.githubusercontent.com:sub': 'repo:victorsmirnov/blog-theme:*' }
      }),
    roleName: 'ThemeDeploymentRole'
  })

  deploymentRole.addToPolicy(new PolicyStatement({
    actions: ['cloudfront:CreateInvalidation'],
    effect: Effect.ALLOW,
    resources: [`arn:aws:cloudfront::${String(env.account)}:distribution/${cloudFront.distributionId}`]
  }))

  siteBucket.grantReadWrite(deploymentRole)
}
