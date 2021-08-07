import {Construct} from "@aws-cdk/core";
import {AuroraCapacityUnit, Credentials, DatabaseClusterEngine, ServerlessCluster} from "@aws-cdk/aws-rds";
import {IVpc, SubnetType} from "@aws-cdk/aws-ec2";

export interface AuroraClusterProps {
    readonly vpc: IVpc;
}

/**
 * Aurora serverless cluster for our blog.
 * 1. Put credentials to the secret.
 * 2. Allocate cluster in isolated network.
 * 3. Enabling data API allows us to use Query editor in AWS RDS console. This is not needed for Ghost.
 */
export class AuroraCluster extends ServerlessCluster {
    constructor(scope: Construct, props: AuroraClusterProps) {
        super(scope, "AuroraCluster", {
            clusterIdentifier: "blog",
            credentials: Credentials.fromGeneratedSecret("root"),
            defaultDatabaseName: "ghost",
            enableDataApi: true,
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
