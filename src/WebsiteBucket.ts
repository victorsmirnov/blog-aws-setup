import { Construct } from 'constructs'
import { RemovalPolicy } from 'aws-cdk-lib'
import { BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption } from 'aws-cdk-lib/aws-s3'

export interface WebsiteBucketProps {
  readonly bucketName: string
}

export function createWebsiteBucket (scope: Construct, { bucketName }: WebsiteBucketProps): Bucket {
  return new Bucket(scope, 'WebsiteBucket', {
    accessControl: BucketAccessControl.PRIVATE,
    autoDeleteObjects: false,
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    bucketName,
    encryption: BucketEncryption.S3_MANAGED,
    publicReadAccess: false,
    removalPolicy: RemovalPolicy.RETAIN
  })
}
