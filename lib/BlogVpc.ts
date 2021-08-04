import {SubnetType, Vpc} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";

/**
 * VPC for blog project.
 * 1. We do not have private network and NAT to save some money.
 * 2. We can have up to 15 networks in our VPC and each network can have 4091 IP addresses.
 */
export class BlogVpc extends Vpc {
    constructor(scope: Construct) {
        super(scope, "VPC", {
            cidr: "10.100.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            maxAzs: 3,
            natGateways: 0,
            subnetConfiguration: [
                {
                    cidrMask: 20,
                    name: "Public",
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    cidrMask: 20,
                    name: "Private (isolated)",
                    subnetType: SubnetType.ISOLATED,
                },
            ],
        });
    }
}
