import {Dashboard, GraphWidget} from "@aws-cdk/aws-cloudwatch";
import {Construct} from "@aws-cdk/core";
import {
    HttpCodeElb,
    HttpCodeTarget,
} from "@aws-cdk/aws-elasticloadbalancingv2/lib/alb/application-load-balancer";
import {CloudFrontDist, ErrorRate} from "./CloudFrontDist";
import {ApplicationLoadBalancer} from "@aws-cdk/aws-elasticloadbalancingv2";
import {Instance} from "@aws-cdk/aws-ec2";

export interface MonitoringProps {
    readonly cloudFrontDist: CloudFrontDist;

    readonly loadBalancer: ApplicationLoadBalancer;

    readonly webServer: Instance;
}

export function monitoringDashboard(
    scope: Construct,
    {cloudFrontDist, loadBalancer}: MonitoringProps,
): Dashboard {
    return new Dashboard(scope, "MonitoringDashboard", {
        dashboardName: "blog-monitoring",
        widgets: [
            [
                distributionErrors(cloudFrontDist),
                distributionRequests(cloudFrontDist),
            ],
            [
                targetCodes(loadBalancer),
                elbCodes(loadBalancer),
                targetTime(loadBalancer),
            ],
        ],
    });
}

function distributionErrors(cloudFrontDist: CloudFrontDist): GraphWidget {
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

function distributionRequests(cloudFrontDist: CloudFrontDist): GraphWidget {
    return new GraphWidget({
        height: 8,
        right: [cloudFrontDist.metricRequests()],
        title: "CloudFront Requests",
        width: 12,
    });
}

function elbCodes(loadBalancer: ApplicationLoadBalancer): GraphWidget {
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

function targetCodes(loadBalancer: ApplicationLoadBalancer): GraphWidget {
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

function targetTime(loadBalancer: ApplicationLoadBalancer): GraphWidget {
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
