import {IVpc, SubnetType} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {
    AuroraCapacityUnit,
    Credentials,
    DatabaseClusterEngine,
    ServerlessCluster,
} from "aws-cdk-lib/aws-rds";

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
        vpcSubnets: {subnetType: SubnetType.PRIVATE_ISOLATED, onePerAz: true},
    });
}
