import {IVpc, Peer, Port, SecurityGroup} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";
import {ISecurityGroup} from "@aws-cdk/aws-ec2/lib/security-group";

export interface WebServerSGProps {
    loadBalancerSg: ISecurityGroup;
    vpc: IVpc;
}

/**
 * Ghost and web server instance security group.
 * 1. Allow HTTP and SSH.
 * 2. Allow HTTP and HTTPS from Load balancer. We identify load balancer by its security group.
 */
export class WebServerSG extends SecurityGroup {
    constructor(scope: Construct, props: WebServerSGProps) {
        super(scope, 'WebServerSG', {
            allowAllOutbound: true,
            description: 'Allow SSH and HTTP access to web site instance',
            vpc: props.vpc,
        });
        this.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH');
        this.addIngressRule(props.loadBalancerSg, Port.tcp(80), "Allow HTTP from ALB");
        this.addIngressRule(props.loadBalancerSg, Port.tcp(443), "Allow HTTPS from ALB");
    }
}
