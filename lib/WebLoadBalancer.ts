import {Instance, IVpc, SubnetType} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    ApplicationTargetGroup,
    TargetType
} from "@aws-cdk/aws-elasticloadbalancingv2";
import {ISecurityGroup} from "@aws-cdk/aws-ec2/lib/security-group";
import {IpTarget} from "@aws-cdk/aws-elasticloadbalancingv2-targets";

export interface WebLoadBalancerProps {
    certificateArn: string;
    securityGroup: ISecurityGroup;
    vpc: IVpc;
    webServer: Instance;
}

/**
 * We put our web server behind load balancer.
 * 1. HTTP listener should redirect to HTTPS.
 * 2. HTTPS listener should forward to our web server.
 */
export class WebLoadBalancer extends ApplicationLoadBalancer {
    constructor(scope: Construct, props: WebLoadBalancerProps) {
        super(scope, "WebServerALB", {
            internetFacing: true,
            securityGroup: props.securityGroup,
            vpc: props.vpc,
            vpcSubnets: {subnetType: SubnetType.PUBLIC, onePerAz: true},
        });

        /**
         * Redirects HTTP port 80 to HTTPS port 443.
         * It creates listener automatically, no target group is needed for the redirect.
         */
        this.addRedirect();

        const target = new ApplicationTargetGroup(scope, "WebServerTargetGroup", {
            port: 443,
            protocol: ApplicationProtocol.HTTPS,
            targets: [new IpTarget(props.webServer.instancePrivateIp, 443, props.webServer.instanceAvailabilityZone)],
            targetType: TargetType.IP,
            vpc: props.vpc,
        });

        this.addListener("HttpsListener", {
            certificates: [{certificateArn: props.certificateArn}],
            defaultTargetGroups: [target],
            open: true,
            port: 443,
            protocol: ApplicationProtocol.HTTPS,
        });
    }
}
