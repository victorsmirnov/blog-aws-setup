import { Construct } from 'constructs'
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'

export interface BlogVpcProps {
  readonly certificateArn: string
  readonly vpcCidr: string
  readonly vpnCidr: string
}

/**
 * Create VPC for the project.
 * 1. We do not have private network and NAT to save some money.
 * 2. We can have up to 15 networks in our VPC and each network can have 4091 IP addresses.
 */
export function createVpc (scope: Construct, { vpcCidr }: BlogVpcProps): Vpc {
  return new Vpc(scope, 'VPC', {
    cidr: vpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    maxAzs: 3,
    natGateways: 0,
    subnetConfiguration: [
      {
        cidrMask: 20,
        name: 'Public',
        subnetType: SubnetType.PUBLIC
      },
      {
        cidrMask: 20,
        name: 'Private (isolated)',
        subnetType: SubnetType.PRIVATE_ISOLATED
      }
    ]
  })
}
