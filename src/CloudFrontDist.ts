import {PublicHostedZone} from "aws-cdk-lib/aws-route53";
import {Construct} from "constructs";
import {DnsValidatedCertificate} from "aws-cdk-lib/aws-certificatemanager";
import {
    AllowedMethods,
    CachePolicy,
    Distribution,
    OriginProtocolPolicy,
    OriginRequestPolicy,
    OriginSslPolicy,
    ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {HttpOrigin} from "aws-cdk-lib/aws-cloudfront-origins";
import {Metric, MetricProps, Unit} from "aws-cdk-lib/aws-cloudwatch";

export interface CloudFrontDistProps {
    readonly albDomainName: string;
    readonly domainName: string;
    readonly hostedZone: PublicHostedZone;
}

/**
 * Create CloudFront distribution (and certificate).
 * @param scope
 * @param albDomainName
 * @param domainName
 * @param hostedZone
 */
export function cloudFrontDist(
    scope: Construct,
    {albDomainName, domainName, hostedZone}: CloudFrontDistProps,
): CloudFrontDist {
    const certificate = new DnsValidatedCertificate(scope, "CloudFrontCert", {
        domainName,
        hostedZone: hostedZone,
        region: "us-east-1",
    });

    return new CloudFrontDist(scope, "Distribution", {
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
 * Names for error rate CloudFront metric.
 */
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

/**
 * Extend Distribution with helper methods to define CloudWatch metrics.
 */
export class CloudFrontDist extends Distribution {
    /**
     * CloudFront metric, see
     * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/programming-cloudwatch-metrics.html
     * @param metricName
     * @param props
     */
    public metric(metricName: string, props?: Partial<MetricProps>): Metric {
        return new Metric({
            dimensionsMap: {
                DistributionId: this.distributionId,
                Region: "Global",
            },
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
    public metricErrorRate(
        metricName: ErrorRate,
        props?: Partial<MetricProps>,
    ): Metric {
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
