import { Instance, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { AuroraCapacityUnit, Credentials, DatabaseClusterEngine, ServerlessCluster } from 'aws-cdk-lib/aws-rds'
import { Construct } from 'constructs'

export interface AuroraClusterProps {
  readonly vpc: Vpc
  readonly webServer: Instance
}

/**
 * Create aurora serverless cluster for the project.
 * 1. Put credentials to the secret.
 * 2. Allocate cluster in isolated network.
 * 3. Enable data API.
 */
export function createAuroraCluster (scope: Construct, { vpc, webServer }: AuroraClusterProps): ServerlessCluster {
  const cluster = new ServerlessCluster(scope, 'AuroraCluster', {
    clusterIdentifier: 'blog',
    credentials: Credentials.fromGeneratedSecret('root'),
    defaultDatabaseName: 'ghost',
    enableDataApi: true,
    engine: DatabaseClusterEngine.AURORA_MYSQL,
    scaling: {
      maxCapacity: AuroraCapacityUnit.ACU_4,
      minCapacity: AuroraCapacityUnit.ACU_1
    },
    vpc,
    vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED, onePerAz: true }
  })

  cluster.connections.allowDefaultPortFrom(webServer, 'Allow web server access')

  return cluster
}
