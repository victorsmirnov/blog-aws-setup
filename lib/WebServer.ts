import {Instance, InstanceClass, InstanceSize, InstanceType, IVpc, MachineImage, SubnetType} from "@aws-cdk/aws-ec2";
import {Construct} from "@aws-cdk/core";
import {ISecurityGroup} from "@aws-cdk/aws-ec2/lib/security-group";

export interface WebServerProps {
    keyName: string;
    securityGroup: ISecurityGroup;
    vpc: IVpc;
}

/**
 * EC2 instance running Ghost server and Nginx web server.
 * 1. We place instance in public zone.
 * 2. Security group allows incoming HTTP and SSH traffic and allows to connect to Aurora RDS.
 */
export class WebServer extends Instance {
    constructor(scope: Construct, props: WebServerProps) {
        super(scope, 'WebServer', {
            instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
            keyName: props.keyName,
            machineImage: MachineImage.genericLinux({
                // See https://cloud-images.ubuntu.com/locator/ec2/
                // cpuType: AmazonLinuxCpuType.ARM_64
                'eu-central-1': 'ami-08b1ad0c192aa6611',
                'eu-north-1': 'ami-0a0929d6a878fe378',
                'eu-south-1': 'ami-00e44a31245dd63ef',
                'eu-west-1': 'ami-0db52215604dc9773',
                'eu-west-2': 'ami-08e9b1b7e7aff00e7',
                'eu-west-3': 'ami-08a99b876ef148f77',
            }),
            securityGroup: props.securityGroup,
            vpc: props.vpc,
            vpcSubnets: {subnetType: SubnetType.PUBLIC, onePerAz: true},
        })
    }
}
