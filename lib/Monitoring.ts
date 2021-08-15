import {Dashboard, GraphWidget} from "@aws-cdk/aws-cloudwatch";
import {Construct} from "@aws-cdk/core";
import {LoadBalancer} from "./LoadBalancer";
import {HttpCodeElb, HttpCodeTarget} from "@aws-cdk/aws-elasticloadbalancingv2/lib/alb/application-load-balancer";
import {WebServer} from "./WebServer";
import {CloudFrontDist, ErrorRate} from "./CloudFrontDist";

export interface MonitoringProps {
    readonly cloudFrontDist: CloudFrontDist;

    readonly loadBalancer: LoadBalancer;

    readonly webServer: WebServer;
}

export class Monitoring extends Dashboard {
    constructor(scope: Construct, {cloudFrontDist, loadBalancer}: MonitoringProps) {
        super(scope, "MonitoringDashboard", {
            dashboardName: "blog-monitoring",
            widgets: [
                [
                    Monitoring.distributionErrors(cloudFrontDist),
                    Monitoring.distributionRequests(cloudFrontDist),
                ],
                [
                    Monitoring.targetCodes(loadBalancer),
                    Monitoring.elbCodes(loadBalancer),
                    Monitoring.targetTime(loadBalancer)
                ]
            ],
        });
    }

    private static distributionErrors(cloudFrontDist: CloudFrontDist): GraphWidget {
        return new GraphWidget({
            height: 8,
            right: [
                cloudFrontDist.metricErrorRate(ErrorRate.Total),
                cloudFrontDist.metricErrorRate(ErrorRate.Error5xx),
            ],
            title: "CloudFront Errors",
            width: 12,
        });
    }

    private static distributionRequests(cloudFrontDist: CloudFrontDist): GraphWidget {
        return new GraphWidget({
            height: 8,
            right: [
                cloudFrontDist.metricRequests(),
            ],
            title: "CloudFront Requests",
            width: 12,
        });
    }

    private static elbCodes(loadBalancer: LoadBalancer): GraphWidget {
        return new GraphWidget({
            height: 8,
            right: [
                loadBalancer.metricHttpCodeElb(HttpCodeElb.ELB_3XX_COUNT),
                loadBalancer.metricHttpCodeElb(HttpCodeElb.ELB_4XX_COUNT),
                loadBalancer.metricHttpCodeElb(HttpCodeElb.ELB_5XX_COUNT),
            ],
            title: "ELB Codes",
            width: 8,
        });
    }

    private static targetCodes(loadBalancer: LoadBalancer): GraphWidget {
        return new GraphWidget({
            height: 8,
            right: [
                loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_2XX_COUNT),
                loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_3XX_COUNT),
                loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_4XX_COUNT),
                loadBalancer.metricHttpCodeTarget(HttpCodeTarget.TARGET_5XX_COUNT),
            ],
            title: "ALB Target Codes",
            width: 8,
        });
    }

    private static targetTime(loadBalancer: LoadBalancer): GraphWidget {
        return new GraphWidget({
            height: 8,
            right: [
                loadBalancer.metricTargetResponseTime({statistic: "avg"}),
                loadBalancer.metricTargetResponseTime({statistic: "max"}),
                loadBalancer.metricTargetResponseTime({statistic: "p95"}),
            ],
            title: "ALB Target Response Time",
            width: 8,
        });
    }
}
