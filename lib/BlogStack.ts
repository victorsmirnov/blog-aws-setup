import {CfnOutput, Construct, Stack} from "@aws-cdk/core";
import {blogVpc} from "./BlogVpc";
import {sshKey} from "./SshKey";
import {auroraCluster} from "./AuroraCluster";
import {webServer} from "./WebServer";
import {
    ARecord,
    PublicHostedZone,
    RecordTarget,
    TxtRecord,
} from "@aws-cdk/aws-route53";
import {loadBalancer} from "./LoadBalancer";
import {
    CloudFrontTarget,
    LoadBalancerTarget,
} from "@aws-cdk/aws-route53-targets";
import {Environment} from "@aws-cdk/core/lib/environment";
import {cloudFrontDist, CloudFrontDist} from "./CloudFrontDist";
import {monitoringDashboard} from "./Monitoring";
import {ServerlessCluster} from "@aws-cdk/aws-rds";
import {Instance, Vpc} from "@aws-cdk/aws-ec2";
import {ApplicationLoadBalancer} from "@aws-cdk/aws-elasticloadbalancingv2";
import {Dashboard} from "@aws-cdk/aws-cloudwatch";
import {KeyPair} from "cdk-ec2-key-pair";

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

    public readonly sshKey: KeyPair;

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

        this.sshKey = sshKey(this.stack);

        this.vpc = blogVpc(this.stack, {cidr: vpcCidr});

        this.webServer = webServer(this.stack, {
            keyName: this.sshKey.keyPairName,
            vpc: this.vpc,
        });

        const albDomainName = `srv.${domainName}`;
        this.loadBalancer = loadBalancer(this.stack, {
            albDomainName: albDomainName,
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
            albDomainName: albDomainName,
            domainName,
            hostedZone: this.hostedZone,
        });

        new ARecord(this.stack, "WebServerARecord", {
            target: RecordTarget.fromAlias(
                new CloudFrontTarget(this.cloudFrontDist),
            ),
            zone: this.hostedZone,
        });
        new ARecord(this.stack, "LoadBalancerARecord", {
            recordName: "srv",
            target: RecordTarget.fromAlias(
                new LoadBalancerTarget(this.loadBalancer),
            ),
            zone: this.hostedZone,
        });

        this.monitoring = monitoringDashboard(this.stack, {
            cloudFrontDist: this.cloudFrontDist,
            loadBalancer: this.loadBalancer,
            webServer: this.webServer,
        });

        new CfnOutput(this.stack, "IP Address", {
            value: this.webServer.instancePublicIp,
        });
        new CfnOutput(this.stack, "Key Name", {value: this.sshKey.keyPairName});
        new CfnOutput(this.stack, "Download Key Command", {
            value:
                "aws secretsmanager get-secret-value --secret-id ec2-ssh-key/blog-key/private " +
                "--query SecretString --output text > blog-key.pem && chmod 400 blog-key.pem",
        });
        new CfnOutput(this.stack, "ssh command", {
            value:
                "ssh -i blog-key.pem -o IdentitiesOnly=yes ubuntu@" +
                this.webServer.instancePublicIp,
        });
    }
}
