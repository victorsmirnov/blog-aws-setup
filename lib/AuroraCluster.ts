import {Construct} from "@aws-cdk/core";
import {AuroraCapacityUnit, Credentials, DatabaseClusterEngine, ServerlessCluster} from "@aws-cdk/aws-rds";
import {IVpc, SubnetType} from "@aws-cdk/aws-ec2";

export interface AuroraClusterProps {
    vpc: IVpc;
}

export class AuroraCluster extends ServerlessCluster {
    constructor(scope: Construct, props: AuroraClusterProps) {
        super(scope, 'AuroraCluster', {
            clusterIdentifier: 'blog',
            credentials: Credentials.fromGeneratedSecret('root'),
            defaultDatabaseName: 'ghost',
            engine: DatabaseClusterEngine.AURORA_MYSQL,
            scaling: {
                maxCapacity: AuroraCapacityUnit.ACU_4,
                minCapacity: AuroraCapacityUnit.ACU_1,
            },
            vpc: props.vpc,
            vpcSubnets: {subnetType: SubnetType.ISOLATED, onePerAz: true},
        });
    }
}
