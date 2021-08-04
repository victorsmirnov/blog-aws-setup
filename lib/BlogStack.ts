import {CfnOutput, Construct, Stack, StackProps} from "@aws-cdk/core";
import {Port} from "@aws-cdk/aws-ec2";
import {BlogVpc} from "./BlogVpc";
import {SshKey} from "./SshKey";
import {AuroraCluster} from "./AuroraCluster";
import {WebServer} from "./WebServer";
import {WebServerSG} from "./WebServerSG";
import {ARecord, PublicHostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {WebLoadBalancerSG} from "./WebLoadBalancerSG";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";
import {WebLoadBalancer} from "./WebLoadBalancer";
import {LoadBalancerTarget} from "@aws-cdk/aws-route53-targets";

export class BlogStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        /**
         * I have created hosted zone before and I do not want to recreate it because of all updates in DNS registrator.
         * This how to import existing resource into stack. It is required to specify both zone ID and zone name.
         */
        const blogHostedZone = PublicHostedZone.fromHostedZoneAttributes(this, "HostedZone", {
            hostedZoneId: "Z02825862QFAIGAAQX1SB",
            zoneName: "victorsmirnov.blog",
        });

        const sslCertificate = new Certificate(this, "SslCertificate", {
            domainName: "victorsmirnov.blog",
            validation: CertificateValidation.fromDns(blogHostedZone),
        });

        const key = new SshKey(this);

        const vpc = new BlogVpc(this);

        const loadBalancerSg = new WebLoadBalancerSG(this, {vpc});

        const webServerSG = new WebServerSG(this, {loadBalancerSg, vpc});

        const webServer = new WebServer(this, {
            keyName: key.keyPairName,
            securityGroup: webServerSG,
            vpc,
        });

        const webLoadBalancer = new WebLoadBalancer(this, {
            certificateArn: sslCertificate.certificateArn,
            securityGroup: loadBalancerSg,
            vpc,
            webServer,
        });

        const cluster = new AuroraCluster(this, {vpc});
        cluster.connections.allowFrom(webServerSG, Port.tcp(cluster.clusterEndpoint.port), "Allow web server");

        new ARecord(this, "WebServerARecord", {
            target: RecordTarget.fromAlias(new LoadBalancerTarget(webLoadBalancer)),
            zone: blogHostedZone,
        });

        new CfnOutput(this, "IP Address", {value: webServer.instancePublicIp});
        new CfnOutput(this, "Key Name", {value: key.keyPairName})
        new CfnOutput(this, "Download Key Command", {
            value: "aws secretsmanager get-secret-value --secret-id ec2-ssh-key/blog-key/private " +
                "--query SecretString --output text > blog-key.pem && chmod 400 blog-key.pem"
        })
        new CfnOutput(this, "ssh command", {
            value: "ssh -i blog-key.pem -o IdentitiesOnly=yes ubuntu@" + webServer.instancePublicIp
        })
    }
}
