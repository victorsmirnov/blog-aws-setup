import {IVpc, Peer, Port, SecurityGroup} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";

export interface WebServerSGProps {
    vpc: IVpc;
}

export class WebServerSG extends SecurityGroup {
    constructor(scope: Construct, props: WebServerSGProps) {
        super(scope, 'WebServerSG', {
            allowAllOutbound: true,
            description: 'Allow SSH and HTTP access to web site instance',
            vpc: props.vpc,
        });
        this.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH');
        this.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP');
        this.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow HTTPS');
    }
}
