import { Duration } from 'aws-cdk-lib'
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
  AllowedMethods,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
  Distribution,
  OriginAccessIdentity,
  OriginRequestPolicy,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront'
import { LoadBalancerV2Origin, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export interface CloudFrontProps {
  readonly accessIdentity: OriginAccessIdentity
  readonly domainName: string
  readonly hostedZone: PublicHostedZone
  readonly loadBalancer: ApplicationLoadBalancer
  readonly siteBucket: Bucket
}

/**
 * Create CloudFront distribution (and certificate).
 */
export function createCloudFront (scope: Construct, props: CloudFrontProps): Distribution {
  const { accessIdentity, domainName, hostedZone, loadBalancer, siteBucket } = props

  const certificate = new DnsValidatedCertificate(scope, 'CloudFrontCert', {
    domainName,
    hostedZone,
    region: 'us-east-1'
  })

  const assetsCachePolicy = new CachePolicy(scope, 'AssetsCachePolicy', {
    cachePolicyName: 'AssetsCachePolicy',
    comment: 'Include "v" query parameters in the cache key.',
    cookieBehavior: CacheCookieBehavior.none(),
    defaultTtl: Duration.days(1),
    enableAcceptEncodingBrotli: true,
    enableAcceptEncodingGzip: true,
    headerBehavior: CacheHeaderBehavior.none(),
    maxTtl: Duration.days(365),
    minTtl: Duration.seconds(1),
    queryStringBehavior: CacheQueryStringBehavior.allowList('v')
  })

  const bucketOrigin = new S3Origin(siteBucket, {
    originAccessIdentity: accessIdentity,
    originPath: '/public'
  })

  const loadBalancerOrigin = new LoadBalancerV2Origin(loadBalancer, { httpsPort: 443 })

  return new Distribution(scope, 'Distribution', {
    certificate,
    comment: `${domainName} Ghost site and S3 bucket`,
    defaultBehavior: {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      origin: loadBalancerOrigin,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    },
    additionalBehaviors: {
      '/assets/*': {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: assetsCachePolicy,
        origin: bucketOrigin,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      '/projects/*': {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: assetsCachePolicy,
        origin: bucketOrigin,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    },
    domainNames: [domainName]
  })
}
