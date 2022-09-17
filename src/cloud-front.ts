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
  OriginProtocolPolicy,
  OriginRequestPolicy,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin, OriginGroup, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export interface CloudFrontProps {
  readonly accessIdentity: OriginAccessIdentity
  readonly domainName: string
  readonly serverName: string
  readonly siteBucket: Bucket
  readonly zone: PublicHostedZone
}

/**
 * Create CloudFront distribution (and certificate).
 */
export function createCloudFront (scope: Construct, props: CloudFrontProps): Distribution {
  const { accessIdentity, domainName, zone, serverName, siteBucket } = props

  const certificate = new DnsValidatedCertificate(scope, 'CloudFrontCert', {
    domainName,
    hostedZone: zone,
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

  const httpOrigin = new HttpOrigin(serverName, {
    httpsPort: 443,
    protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY
  })

  return new Distribution(scope, 'Distribution', {
    certificate,
    comment: `${domainName} Ghost site and S3 bucket`,
    defaultBehavior: {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      origin: httpOrigin,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
    },
    additionalBehaviors: {
      '/assets/*': {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: assetsCachePolicy,
        origin: new OriginGroup({
          fallbackOrigin: httpOrigin,
          fallbackStatusCodes: [400, 403, 404, 416, 500, 502, 503, 504],
          primaryOrigin: bucketOrigin
        }),
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    },
    domainNames: [domainName]
  })
}
