import {CfnOutput, Construct, Stack} from "@aws-cdk/core";
import {BlogVpc} from "./BlogVpc";
import {SshKey} from "./SshKey";
import {AuroraCluster} from "./AuroraCluster";
import {WebServer} from "./WebServer";
import {ARecord, PublicHostedZone, RecordTarget, TxtRecord} from "@aws-cdk/aws-route53";
import {Certificate, CertificateValidation, DnsValidatedCertificate} from "@aws-cdk/aws-certificatemanager";
import {LoadBalancer} from "./LoadBalancer";
import {CloudFrontTarget, LoadBalancerTarget} from "@aws-cdk/aws-route53-targets";
import {Environment} from "@aws-cdk/core/lib/environment";
import {Distribution} from "@aws-cdk/aws-cloudfront";
import {CloudFrontDist} from "./CloudFrontDist";

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
export class BlogStack extends Stack {
    public readonly albDomainName: string;

    public readonly auroraCluster: AuroraCluster;

    public readonly cloudFrontCert: Certificate;

    public readonly cloudFrontDist: Distribution;

    public readonly hostedZone: PublicHostedZone;

    public readonly loadBalancer: LoadBalancer;

    public readonly sshKey: SshKey;

    public readonly loadBalancerCert: Certificate;

    public readonly vpc: BlogVpc;

    public readonly webServer: WebServer;

    constructor(scope: Construct, {domainName, env, googleVerify, vpcCidr}: BlogStackProps) {
        super(scope, "BlogStack", {env});

        this.hostedZone = new PublicHostedZone(this, "HostedZone", {
            zoneName: domainName,
        })
        if (googleVerify !== undefined) {
            new TxtRecord(this, "GoogleVerification", {
                values: [googleVerify],
                zone: this.hostedZone,
            });
        }

        this.albDomainName = `srv.${domainName}`;
        this.loadBalancerCert = new Certificate(this, "SslCertificate", {
            domainName,
            subjectAlternativeNames: [this.albDomainName],
            validation: CertificateValidation.fromDns(this.hostedZone),
        });

        this.sshKey = new SshKey(this);

        this.vpc = new BlogVpc(this, {cidr: vpcCidr});

        this.webServer = new WebServer(this, {
            keyName: this.sshKey.keyPairName,
            vpc: this.vpc,
        });

        this.loadBalancer = new LoadBalancer(this, {
            certificateArn: this.loadBalancerCert.certificateArn,
            vpc: this.vpc,
            webServer: this.webServer,
        });

        this.auroraCluster = new AuroraCluster(this, {vpc: this.vpc});
        this.auroraCluster.connections.allowDefaultPortFrom(this.webServer, "Allow web server access");

        this.cloudFrontCert = new DnsValidatedCertificate(this, "CloudFrontCert", {
            domainName,
            hostedZone: this.hostedZone,
            region: "us-east-1",
        });

        this.cloudFrontDist = new CloudFrontDist(this, {
            albDomainName: this.albDomainName,
            certificate: this.cloudFrontCert,
            domainName,
        });

        new ARecord(this, "WebServerARecord", {
            target: RecordTarget.fromAlias(new CloudFrontTarget(this.cloudFrontDist)),
            zone: this.hostedZone,
        });
        new ARecord(this, "LoadBalancerARecord", {
            recordName: "srv",
            target: RecordTarget.fromAlias(new LoadBalancerTarget(this.loadBalancer)),
            zone: this.hostedZone,
        });

        new CfnOutput(this, "IP Address", {value: this.webServer.instancePublicIp});
        new CfnOutput(this, "Key Name", {value: this.sshKey.keyPairName})
        new CfnOutput(this, "Download Key Command", {
            value: "aws secretsmanager get-secret-value --secret-id ec2-ssh-key/blog-key/private " +
                "--query SecretString --output text > blog-key.pem && chmod 400 blog-key.pem"
        })
        new CfnOutput(this, "ssh command", {
            value: "ssh -i blog-key.pem -o IdentitiesOnly=yes ubuntu@" + this.webServer.instancePublicIp
        })
    }
}
