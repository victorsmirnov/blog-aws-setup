import {Construct} from "constructs";
import {
    Instance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    IVpc,
    MachineImage,
    Port,
    SecurityGroup,
    SubnetType,
} from "aws-cdk-lib/aws-ec2";

export interface WebServerProps {
    readonly vpc: IVpc;
}

/**
 * EC2 instance running Ghost server and Nginx web server.
 * 1. We place instance in public zone.
 * 2. Security group allows incoming HTTP traffic to the Ghost service and allows to connect to Aurora RDS.
 */
export function webServer(scope: Construct, props: WebServerProps): Instance {
    const instance = new Instance(scope, "WebServer", {
        instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
        machineImage: MachineImage.genericLinux({
            // See https://cloud-images.ubuntu.com/locator/ec2/
            // cpuType: AmazonLinuxCpuType.ARM_64
            // version: 20.04 LTS
            "eu-west-1": "ami-022add1fa99971fec",
        }),
        securityGroup: new SecurityGroup(scope, "WebServerSG", {
            allowAllOutbound: true,
            description: "Allow SSH and HTTP access to web site instance",
            vpc: props.vpc,
        }),
        vpc: props.vpc,
        vpcSubnets: {subnetType: SubnetType.PUBLIC, onePerAz: true},
    });
    instance.connections.allowFromAnyIpv4(Port.tcp(22), "Allow SSH");

    return instance;
}
