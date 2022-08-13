import { Construct } from 'constructs'
import { RemovalPolicy } from 'aws-cdk-lib'
import { BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption } from 'aws-cdk-lib/aws-s3'
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

export interface WebsiteBucketProps {
  readonly accessIdentity: OriginAccessIdentity
  readonly bucketName: string
}

export function createWebsiteBucket (scope: Construct, { accessIdentity, bucketName }: WebsiteBucketProps): Bucket {
  const bucket = new Bucket(scope, 'WebsiteBucket', {
    accessControl: BucketAccessControl.PRIVATE,
    autoDeleteObjects: false,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    bucketName,
    encryption: BucketEncryption.S3_MANAGED,
    publicReadAccess: false,
    removalPolicy: RemovalPolicy.RETAIN
  })

  const cloudfrontAccessPolicy = new PolicyStatement({
    actions: ['s3:GetObject'],
    effect: Effect.ALLOW,
    principals: [accessIdentity.grantPrincipal],
    resources: [bucket.arnForObjects('*')]
  })
  bucket.addToResourcePolicy(cloudfrontAccessPolicy)

  return bucket
}
