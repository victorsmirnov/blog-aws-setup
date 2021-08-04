import {IVpc, Peer, Port, SecurityGroup} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";

export interface WebLoadBalancerSGProps {
    vpc: IVpc;
}

/**
 * Ghost and web server instance security group.
 * 1. Allow HTTP and SSH.
 * 2. I plan to remove HTTPS and restrict HTTP to ALB only.
 */
export class WebLoadBalancerSG extends SecurityGroup {
    constructor(scope: Construct, props: WebLoadBalancerSGProps) {
        super(scope, 'WebLoadBalancerSG', {
            allowAllOutbound: true,
            description: 'Allow public HTTP and HTTPS access.',
            vpc: props.vpc,
        });
        this.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP');
        this.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow HTTPS');
    }
}
