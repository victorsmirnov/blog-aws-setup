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

export interface CloudFrontDistProps {
    readonly albDomainName: string;
    readonly certificate: ICertificate;
    readonly domainName: string;
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
}
