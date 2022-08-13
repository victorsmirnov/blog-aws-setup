import { ErrorRate, metricErrorRate, metricRequests } from './cloud-front-metrics.js'
import { ApplicationLoadBalancer, HttpCodeElb, HttpCodeTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Instance } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import { Dashboard, GraphWidget } from 'aws-cdk-lib/aws-cloudwatch'

export interface MonitoringProps {
  readonly distributionId: string
  readonly loadBalancer: ApplicationLoadBalancer
  readonly webServer: Instance
}

export function createDashboard (scope: Construct, { distributionId, loadBalancer }: MonitoringProps): Dashboard {
  return new Dashboard(scope, 'MonitoringDashboard', {
    dashboardName: 'blog-monitoring',
    widgets: [
      [
        distributionErrors(distributionId),
        distributionRequests(distributionId)
      ],
      [
        targetCodes(loadBalancer),
        elbCodes(loadBalancer),
        targetTime(loadBalancer)
      ]
    ]
  })
}

function distributionErrors (distributionId: string): GraphWidget {
  return new GraphWidget({
    height: 8,
    right: [
      metricErrorRate(distributionId, ErrorRate.Total),
      metricErrorRate(distributionId, ErrorRate.Error5xx)
    ],
    title: 'CloudFront Errors',
    width: 12
  })
}

function distributionRequests (distributionId: string): GraphWidget {
  return new GraphWidget({
    height: 8,
    right: [metricRequests(distributionId)],
    title: 'CloudFront Requests',
    width: 12
  })
}

function elbCodes (loadBalancer: ApplicationLoadBalancer): GraphWidget {
  return new GraphWidget({
    height: 8,
    right: [
      loadBalancer.metricHttpCodeElb(HttpCodeElb.ELB_3XX_COUNT),
      loadBalancer.metricHttpCodeElb(HttpCodeElb.ELB_4XX_COUNT),
      loadBalancer.metricHttpCodeElb(HttpCodeElb.ELB_5XX_COUNT)
    ],
    title: 'ELB Codes',
    width: 8
  })
}

function targetCodes (loadBalancer: ApplicationLoadBalancer): GraphWidget {
  return new GraphWidget({
    height: 8,
    right: [
      loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_2XX_COUNT),
      loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_3XX_COUNT),
      loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_4XX_COUNT),
      loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_5XX_COUNT)
    ],
    title: 'ALB Target Codes',
    width: 8
  })
}

function targetTime (loadBalancer: ApplicationLoadBalancer): GraphWidget {
  return new GraphWidget({
    height: 8,
    right: [
      loadBalancer.metricTargetResponseTime({ statistic: 'avg' }),
      loadBalancer.metricTargetResponseTime({ statistic: 'max' }),
      loadBalancer.metricTargetResponseTime({ statistic: 'p95' })
    ],
    title: 'ALB Target Response Time',
    width: 8
  })
}
