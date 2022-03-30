import {Construct} from "@aws-cdk/core";
import {
    AuroraCapacityUnit,
    Credentials,
    DatabaseClusterEngine,
    ServerlessCluster,
} from "@aws-cdk/aws-rds";
import {IVpc, SubnetType} from "@aws-cdk/aws-ec2";

export interface AuroraClusterProps {
    readonly vpc: IVpc;
}

/**
 * Create aurora serverless cluster for the project.
 * 1. Put credentials to the secret.
 * 2. Allocate cluster in isolated network.
 * 3. Enable data API.
 */
export function auroraCluster(
    scope: Construct,
    props: AuroraClusterProps,
): ServerlessCluster {
    return new ServerlessCluster(scope, "AuroraCluster", {
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
