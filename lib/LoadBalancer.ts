import {Instance, IVpc, Port, SecurityGroup, SubnetType} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    ApplicationTargetGroup,
    TargetType
} from "@aws-cdk/aws-elasticloadbalancingv2";
import {IpTarget} from "@aws-cdk/aws-elasticloadbalancingv2-targets";

export interface LoadBalancerProps {
    certificateArn: string;

    vpc: IVpc;

    webServer: Instance;
}

/**
 * We put our web server behind load balancer.
 * 1. HTTP listener should redirect to HTTPS.
 * 2. HTTPS listener should forward to our web server.
 */
export class LoadBalancer extends ApplicationLoadBalancer {
    constructor(scope: Construct, {certificateArn, vpc, webServer}: LoadBalancerProps) {
        super(scope, "WebServerALB", {
            internetFacing: true,
            securityGroup: new SecurityGroup(scope, "WebLoadBalancerSG", {
                allowAllOutbound: true,
                description: "Allow public HTTP and HTTPS access.",
                vpc,
            }),
            vpc,
            vpcSubnets: {subnetType: SubnetType.PUBLIC, onePerAz: true},
        });

        this.connections.allowFromAnyIpv4(Port.tcp(80), "Allow HTTP");
        this.connections.allowFromAnyIpv4(Port.tcp(443), "Allow HTTPS");

        webServer.connections.allowFrom(this, Port.tcp(80), "Allow HTTP from ALB");
        webServer.connections.allowFrom(this, Port.tcp(443), "Allow HTTPS from ALB");

        /**
         * Redirects HTTP port 80 to HTTPS port 443.
         * It creates listener automatically, no target group is needed for the redirect.
         */
        this.addRedirect();

        const target = new ApplicationTargetGroup(scope, "WebServerTargetGroup", {
            port: 443,
            protocol: ApplicationProtocol.HTTPS,
            targets: [new IpTarget(webServer.instancePrivateIp, 443, webServer.instanceAvailabilityZone)],
            targetType: TargetType.IP,
            vpc,
        });

        this.addListener("HttpsListener", {
            certificates: [{certificateArn}],
            defaultTargetGroups: [target],
            open: true,
            port: 443,
            protocol: ApplicationProtocol.HTTPS,
        });
    }
}
