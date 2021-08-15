import {
    AllowedMethods,
    CachePolicy,
    Distribution,
    OriginProtocolPolicy,
    OriginRequestPolicy,
    OriginSslPolicy,
    ViewerProtocolPolicy
} from "@aws-cdk/aws-cloudfront";
import {HttpOrigin} from "@aws-cdk/aws-cloudfront-origins";
import {ICertificate} from "@aws-cdk/aws-certificatemanager/lib/certificate";
import {Construct} from "@aws-cdk/core";
import {Metric, Unit} from "@aws-cdk/aws-cloudwatch";
import {MetricProps} from "@aws-cdk/aws-cloudwatch/lib/metric";

export interface CloudFrontDistProps {
    readonly albDomainName: string;
    readonly certificate: ICertificate;
    readonly domainName: string;
}

export const enum ErrorRate {
    Error4xx = "ErrorRate4xx",
    Error401 = "401ErrorRate",
    Error403 = "403ErrorRate",
    Error404 = "404ErrorRate",
    Error5xx = "5xxErrorRate",
    Error502 = "502ErrorRate",
    Error503 = "503ErrorRate",
    Error504 = "504ErrorRate",
    Total = "TotalErrorRate",
}

export class CloudFrontDist extends Distribution {
    constructor(scope: Construct, {albDomainName, certificate, domainName}: CloudFrontDistProps) {
        super(scope, "Distribution", {
            certificate,
            defaultBehavior: {
                allowedMethods: AllowedMethods.ALLOW_ALL,
                cachePolicy: CachePolicy.CACHING_OPTIMIZED,
                origin: new HttpOrigin(albDomainName, {
                    originSslProtocols: [OriginSslPolicy.TLS_V1_2],
                    protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
                }),
                originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
                viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            domainNames: [domainName],
        });
    }

    /**
     * CloudFront metric, see
     * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/programming-cloudwatch-metrics.html
     * @param metricName
     * @param props
     */
    public metric(metricName: string, props?: Partial<MetricProps>): Metric {
        return new Metric({
            dimensions: {DistributionId: this.distributionId, Region: "Global"},
            metricName,
            namespace: "AWS/CloudFront",
            region: "us-east-1",
            ...props,
        });
    }

    /**
     * The percentage of all viewer requests for which the response’s HTTP status code is 4xx or 5xx.
     * @param metricName
     * @param props
     */
    public metricErrorRate(metricName: ErrorRate, props?: Partial<MetricProps>): Metric {
        return this.metric(metricName, {
            statistic: "avg",
            unit: Unit.PERCENT,
            ...props,
        });
    }

    /**
     * The total number of viewer requests received by CloudFront, for all HTTP methods and for both HTTP
     * and HTTPS requests.
     * @param props
     */
    public metricRequests(props?: Partial<MetricProps>): Metric {
        return this.metric("Requests", {
            statistic: "sum",
            unit: Unit.NONE,
            ...props,
        });
    }
}
