import { Construct } from 'constructs'
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam'
import {
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc
} from 'aws-cdk-lib/aws-ec2'

export interface WebServerProps {
  readonly vpc: Vpc
}

/**
 * EC2 instance running Ghost server and Nginx web server.
 * 1. We place instance in public zone.
 * 2. Security group allows incoming HTTP traffic to the Ghost service and allows to connect to Aurora RDS.
 */
export function createWebServer (scope: Construct, { vpc }: WebServerProps): Instance {
  const instance = new Instance(scope, 'WebServer', {
    instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
    machineImage: MachineImage.genericLinux({
      // See https://cloud-images.ubuntu.com/locator/ec2/
      // cpuType: AmazonLinuxCpuType.ARM_64
      // version: 20.04 LTS
      'eu-west-1': 'ami-022add1fa99971fec'
    }),
    securityGroup: new SecurityGroup(scope, 'WebServerSG', {
      allowAllOutbound: true,
      description: 'Allow SSH and Ghost app access to web site instance',
      vpc
    }),
    vpc,
    vpcSubnets: { subnetType: SubnetType.PUBLIC, onePerAz: true }
  })

  instance.connections.allowFromAnyIpv4(Port.tcp(22), 'Allow SSH')

  instance.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'))

  return instance
}
