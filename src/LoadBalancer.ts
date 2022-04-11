import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Instance, IVpc, Port, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2'
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

export interface LoadBalancerProps {
  readonly domainName: string

  readonly hostedZone: PublicHostedZone

  readonly vpc: IVpc

  readonly webServer: Instance
}

/**
 * We put our web server behind load balancer.
 * 1. HTTP listener should redirect to HTTPS.
 * 2. HTTPS listener should forward to our web server.
 */
export function loadBalancer (
  scope: Construct,
  { domainName, hostedZone, vpc, webServer }: LoadBalancerProps
): ApplicationLoadBalancer {
  const loadBalancerCert = new Certificate(scope, 'SslCertificate', {
    domainName,
    validation: CertificateValidation.fromDns(hostedZone)
  })

  const alb = new ApplicationLoadBalancer(scope, 'WebServerALB', {
    internetFacing: true,
    securityGroup: new SecurityGroup(scope, 'WebLoadBalancerSG', {
      allowAllOutbound: true,
      description: 'Allow public HTTP and HTTPS access.',
      vpc
    }),
    vpc,
    vpcSubnets: { subnetType: SubnetType.PUBLIC, onePerAz: true }
  })

  alb.connections.allowFromAnyIpv4(Port.tcp(443), 'Allow HTTPS')
  webServer.connections.allowFrom(
    alb,
    Port.tcp(2369),
    'Allow Ghost connection from ALB'
  )

  const target = new ApplicationTargetGroup(scope, 'WebServerTargetGroup', {
    port: 2369,
    protocol: ApplicationProtocol.HTTP,
    targets: [
      new IpTarget(
        webServer.instancePrivateIp,
        2369,
        webServer.instanceAvailabilityZone
      )
    ],
    targetType: TargetType.IP,
    vpc
  })

  target.configureHealthCheck({
    // Seems like we do not have health check URL yet.
    // https://github.com/TryGhost/Ghost/issues/11181
    // https://github.com/TryGhost/Ghost/pull/13117
    healthyHttpCodes: '200,301',
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
