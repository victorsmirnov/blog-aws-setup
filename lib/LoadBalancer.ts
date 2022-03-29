import {
    Instance,
    IVpc,
    Port,
    SecurityGroup,
    SubnetType,
} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    ApplicationTargetGroup,
    SslPolicy,
    TargetType,
} from "@aws-cdk/aws-elasticloadbalancingv2";
import {IpTarget} from "@aws-cdk/aws-elasticloadbalancingv2-targets";
import {
    Certificate,
    CertificateValidation,
} from "@aws-cdk/aws-certificatemanager";
import {PublicHostedZone} from "@aws-cdk/aws-route53";

export interface LoadBalancerProps {
    albDomainName: string;

    domainName: string;

    readonly hostedZone: PublicHostedZone;

    vpc: IVpc;

    webServer: Instance;
}

/**
 * We put our web server behind load balancer.
 * 1. HTTP listener should redirect to HTTPS.
 * 2. HTTPS listener should forward to our web server.
 */
export function loadBalancer(
    scope: Construct,
    {albDomainName, hostedZone, domainName, vpc, webServer}: LoadBalancerProps,
): ApplicationLoadBalancer {
    const loadBalancerCert = new Certificate(scope, "SslCertificate", {
        domainName,
        subjectAlternativeNames: [albDomainName],
        validation: CertificateValidation.fromDns(hostedZone),
    });

    const alb = new ApplicationLoadBalancer(scope, "WebServerALB", {
        internetFacing: true,
        securityGroup: new SecurityGroup(scope, "WebLoadBalancerSG", {
            allowAllOutbound: true,
            description: "Allow public HTTP and HTTPS access.",
            vpc,
        }),
        vpc,
        vpcSubnets: {subnetType: SubnetType.PUBLIC, onePerAz: true},
    });

    alb.connections.allowFromAnyIpv4(Port.tcp(443), "Allow HTTPS");
    webServer.connections.allowFrom(alb, Port.tcp(443), "Allow HTTPS from ALB");

    const target = new ApplicationTargetGroup(scope, "WebServerTargetGroup", {
        port: 443,
        protocol: ApplicationProtocol.HTTPS,
        targets: [
            new IpTarget(
                webServer.instancePrivateIp,
                443,
                webServer.instanceAvailabilityZone,
            ),
        ],
        targetType: TargetType.IP,
        vpc,
    });

    alb.addListener("HttpsListener", {
        certificates: [{certificateArn: loadBalancerCert.certificateArn}],
        defaultTargetGroups: [target],
        open: true,
        port: 443,
        protocol: ApplicationProtocol.HTTPS,
        sslPolicy: SslPolicy.FORWARD_SECRECY_TLS12,
    });

    return alb;
}
