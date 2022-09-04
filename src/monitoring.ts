import { ErrorRate, metricErrorRate, metricRequests } from './cloud-front-metrics.js'
import { Construct } from 'constructs'
import { Dashboard, GraphWidget } from 'aws-cdk-lib/aws-cloudwatch'

export interface MonitoringProps {
  readonly distributionId: string
}

export function createDashboard (scope: Construct, { distributionId }: MonitoringProps): Dashboard {
  return new Dashboard(scope, 'MonitoringDashboard', {
    dashboardName: 'blog-monitoring',
    widgets: [
      [
        distributionErrors(distributionId),
        distributionRequests(distributionId)
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
