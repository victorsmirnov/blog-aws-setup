import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Instance, Port, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ApplicationTargetGroup,
  SslPolicy,
  TargetType
} from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import { IpTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'
import { Duration } from 'aws-cdk-lib'

export interface LoadBalancerProps {
  readonly domainName: string
  readonly hostedZone: PublicHostedZone
  readonly vpc: Vpc
  readonly webServer: Instance
  readonly webServerPort: number
}

/**
 * We put our web server behind load balancer.
 * 1. No HTTP listener.
 * 2. HTTPS listener forwards to the web server.
 */
export function createLoadBalancer (scope: Construct, props: LoadBalancerProps): ApplicationLoadBalancer {
  const { domainName, hostedZone, vpc, webServer, webServerPort } = props
  const loadBalancerCert = new Certificate(scope, 'SslCertificate', {
    domainName,
    validation: CertificateValidation.fromDns(hostedZone)
  })

  const alb = new ApplicationLoadBalancer(scope, 'WebServerALB', {
    internetFacing: true,
    vpc,
    vpcSubnets: { subnetType: SubnetType.PUBLIC, onePerAz: true }
  })

  webServer.connections.allowFrom(alb, Port.tcp(webServerPort), 'Allow Ghost connection from ALB')

  const target = new ApplicationTargetGroup(scope, 'WebServerTargetGroup', {
    port: webServerPort,
    protocol: ApplicationProtocol.HTTP,
    targets: [new IpTarget(webServer.instancePrivateIp, webServerPort)],
    targetType: TargetType.IP,
    vpc
  })

  target.configureHealthCheck({
    // Seems like we do not have health check URL yet.
    // https://github.com/TryGhost/Ghost/issues/11181
    // https://github.com/TryGhost/Ghost/pull/13117
    healthyHttpCodes: '200,301',
    interval: Duration.seconds(300),
    path: '/health'
  })

  alb.addListener('HttpsListener', {
    certificates: [{ certificateArn: loadBalancerCert.certificateArn }],
    defaultTargetGroups: [target],
    open: true,
    port: 443,
    protocol: ApplicationProtocol.HTTPS,
    sslPolicy: SslPolicy.FORWARD_SECRECY_TLS12
  })

  return alb
}
