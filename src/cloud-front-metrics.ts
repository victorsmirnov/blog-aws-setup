import { Metric, MetricProps, Unit } from 'aws-cdk-lib/aws-cloudwatch'

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
 * CloudFront metric, see
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/programming-cloudwatch-metrics.html
 */
export function metric (distributionId: string, metricName: string, props?: Partial<MetricProps>): Metric {
  return new Metric({
    dimensionsMap: {
      DistributionId: distributionId,
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
export function metricErrorRate (distributionId: string, metricName: ErrorRate, props?: Partial<MetricProps>): Metric {
  return metric(distributionId, metricName, {
    statistic: 'avg',
    unit: Unit.PERCENT,
    ...props
  })
}

/**
 * The total number of viewer requests received by CloudFront, for all HTTP methods and for both HTTP
 * and HTTPS requests.
 */
export function metricRequests (distributionId: string, props?: Partial<MetricProps>): Metric {
  return metric(distributionId, 'Requests', {
    statistic: 'sum',
    unit: Unit.NONE,
    ...props
  })
}
