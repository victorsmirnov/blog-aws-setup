import {SubnetType, Vpc} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";

export interface BlogVpcProps {
    readonly cidr: string;
}

/**
 * Create VPC for the project.
 * 1. We do not have private network and NAT to save some money.
 * 2. We can have up to 15 networks in our VPC and each network can have 4091 IP addresses.
 */
export function blogVpc(scope: Construct, {cidr}: BlogVpcProps): Vpc {
    return new Vpc(scope, "VPC", {
        cidr,
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
