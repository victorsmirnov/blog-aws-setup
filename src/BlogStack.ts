import {Construct, Stack} from "@aws-cdk/core";
import {blogVpc} from "./BlogVpc.js";
import {auroraCluster} from "./AuroraCluster.js";
import {webServer} from "./WebServer.js";
import {
    ARecord,
    PublicHostedZone,
    RecordTarget,
    TxtRecord,
} from "@aws-cdk/aws-route53";
import {loadBalancer} from "./LoadBalancer.js";
import {CloudFrontTarget} from "@aws-cdk/aws-route53-targets";
import {Environment} from "@aws-cdk/core/lib/environment";
import {cloudFrontDist, CloudFrontDist} from "./CloudFrontDist.js";
import {monitoringDashboard} from "./Monitoring.js";
import {ServerlessCluster} from "@aws-cdk/aws-rds";
import {Instance, Vpc} from "@aws-cdk/aws-ec2";
import {ApplicationLoadBalancer} from "@aws-cdk/aws-elasticloadbalancingv2";
import {Dashboard} from "@aws-cdk/aws-cloudwatch";

export interface BlogStackProps {
    /**
     * Blog domain name.
     */
    readonly domainName: string;

    /**
     * AWS environment where we deploy our stack.
     */
    readonly env: Environment;

    /**
     * Site verification for Google Analytics.
     */
    readonly googleVerify?: string;

    /**
     * VPC CIDR. We assume the CIDR size to equal 16. Subnets CIDR mask is 20 and we leave 4 bits for subnet numbers.
     * For example, "10.100.0.0/16"
     */
    readonly vpcCidr: string;
}

/**
 * Define blog stack.
 */
export class BlogStack {
    public readonly stack: Stack;

    public readonly auroraCluster: ServerlessCluster;

    public readonly cloudFrontDist: CloudFrontDist;

    public readonly hostedZone: PublicHostedZone;

    public readonly loadBalancer: ApplicationLoadBalancer;

    public readonly monitoring: Dashboard;

    public readonly vpc: Vpc;

    public readonly webServer: Instance;

    constructor(
        scope: Construct,
        {domainName, env, googleVerify, vpcCidr}: BlogStackProps,
    ) {
        this.stack = new Stack(scope, "BlogStack", {env});

        this.hostedZone = new PublicHostedZone(this.stack, "HostedZone", {
            zoneName: domainName,
        });
        if (googleVerify !== undefined) {
            new TxtRecord(this.stack, "GoogleVerification", {
                values: [googleVerify],
                zone: this.hostedZone,
            });
        }

        this.vpc = blogVpc(this.stack, {cidr: vpcCidr});

        this.webServer = webServer(this.stack, {
            vpc: this.vpc,
        });

        this.loadBalancer = loadBalancer(this.stack, {
            domainName,
            hostedZone: this.hostedZone,
            vpc: this.vpc,
            webServer: this.webServer,
        });

        this.auroraCluster = auroraCluster(this.stack, {vpc: this.vpc});
        this.auroraCluster.connections.allowDefaultPortFrom(
            this.webServer,
            "Allow web server access",
        );

        this.cloudFrontDist = cloudFrontDist(this.stack, {
            albDomainName: this.loadBalancer.loadBalancerDnsName,
            domainName,
            hostedZone: this.hostedZone,
        });

        new ARecord(this.stack, "WebServerARecord", {
            target: RecordTarget.fromAlias(
                new CloudFrontTarget(this.cloudFrontDist),
            ),
            zone: this.hostedZone,
        });

        this.monitoring = monitoringDashboard(this.stack, {
            cloudFrontDist: this.cloudFrontDist,
            loadBalancer: this.loadBalancer,
            webServer: this.webServer,
        });
    }
}
