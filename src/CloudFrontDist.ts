import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { Duration } from 'aws-cdk-lib'
import { DnsValidatedCertificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
  AllowedMethods,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
  Distribution,
  OriginAccessIdentity, OriginRequestCookieBehavior, OriginRequestHeaderBehavior,
  OriginRequestPolicy, OriginRequestQueryStringBehavior,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront'
import { LoadBalancerV2Origin, OriginGroup, S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { Metric, MetricProps, Unit } from 'aws-cdk-lib/aws-cloudwatch'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export interface CloudFrontDistProps {
  readonly domainName: string
  readonly hostedZone: PublicHostedZone
  readonly loadBalancer: ApplicationLoadBalancer
  readonly originAccessIdentity: OriginAccessIdentity
  readonly siteBucket: Bucket
}

/**
 * Create CloudFront distribution (and certificate).
 */
export function createCloudFrontDist (scope: Construct, {
  domainName,
  hostedZone,
  loadBalancer,
  originAccessIdentity,
  siteBucket
}: CloudFrontDistProps): CloudFrontDist {
  const certificate = new DnsValidatedCertificate(scope, 'CloudFrontCert', {
    domainName,
    hostedZone: hostedZone,
    region: 'us-east-1'
  })

  const assetsCachePolicy = new CachePolicy(scope, 'AssetsCachePolicy', {
    cachePolicyName: 'AssetsCachePolicy',
    comment: 'Include "v" query parameters in the cache key.',
    cookieBehavior: CacheCookieBehavior.none(),
    defaultTtl: Duration.seconds(86400), // 86400 seconds = 1 day
    enableAcceptEncodingBrotli: true,
    enableAcceptEncodingGzip: true,
    headerBehavior: CacheHeaderBehavior.none(),
    maxTtl: Duration.seconds(365 * 24 * 60 * 60), // 31536000 seconds = 1 year
    minTtl: Duration.seconds(1),
    queryStringBehavior: CacheQueryStringBehavior.allowList('v')
  })

  const assetsOriginRequestPolicy = new OriginRequestPolicy(scope, 'AssetsOriginRequestPolicy', {
    comment: 'For S3 and Ghost server',
    cookieBehavior: OriginRequestCookieBehavior.none(),
    headerBehavior: OriginRequestHeaderBehavior.allowList(
      'Access-Control-Request-Headers', 'Access-Control-Request-Method', 'Host', 'Origin'),
    originRequestPolicyName: 'AssetsOriginRequestPolicy',
    queryStringBehavior: OriginRequestQueryStringBehavior.none()
  })

  const bucketOrigin = new S3Origin(siteBucket, {
    originAccessIdentity,
    originPath: '/public'
  })

  const loadBalancerOrigin = new LoadBalancerV2Origin(loadBalancer)

  return new CloudFrontDist(scope, 'Distribution', {
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
      '/projects/*': {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: assetsCachePolicy,
        origin: bucketOrigin,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      '/assets/*': {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        origin: new OriginGroup({
          fallbackOrigin: loadBalancerOrigin,
          fallbackStatusCodes: [403, 404],
          primaryOrigin: bucketOrigin
        }),
        originRequestPolicy: assetsOriginRequestPolicy,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    },
    domainNames: [domainName]
  })
}

/**
 * Names for error rate CloudFront metric.
 */
export const enum ErrorRate {
  Error4xx = 'ErrorRate4xx',
  Error401 = '401ErrorRate',
  Error403 = '403ErrorRate',
  Error404 = '404ErrorRate',
  Error5xx = '5xxErrorRate',
  Error502 = '502ErrorRate',
  Error503 = '503ErrorRate',
  Error504 = '504ErrorRate',
  Total = 'TotalErrorRate',
}

/**
 * Extend Distribution with helper methods to define CloudWatch metrics.
 */
export class CloudFrontDist extends Distribution {
  /**
   * CloudFront metric, see
   * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/programming-cloudwatch-metrics.html
   */
  public metric (metricName: string, props?: Partial<MetricProps>): Metric {
    return new Metric({
      dimensionsMap: {
        DistributionId: this.distributionId,
        Region: 'Global'
      },
      metricName,
      namespace: 'AWS/CloudFront',
      region: 'us-east-1',
      ...props
    })
  }

  /**
   * The percentage of all viewer requests for which the response’s HTTP status code is 4xx or 5xx.
   */
  public metricErrorRate (
    metricName: ErrorRate,
    props?: Partial<MetricProps>
  ): Metric {
    return this.metric(metricName, {
      statistic: 'avg',
      unit: Unit.PERCENT,
      ...props
    })
  }

  /**
   * The total number of viewer requests received by CloudFront, for all HTTP methods and for both HTTP
   * and HTTPS requests.
   */
  public metricRequests (props?: Partial<MetricProps>): Metric {
    return this.metric('Requests', {
      statistic: 'sum',
      unit: Unit.NONE,
      ...props
    })
  }
}
