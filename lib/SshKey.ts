import {Construct} from "@aws-cdk/core";
import {KeyPair} from "cdk-ec2-key-pair";

export class SshKey extends KeyPair {
    constructor(scope: Construct) {
        super(scope, 'KeyPair', {
            name: 'blog-key',
            description: 'Key Pair created with CDK Deployment',
        });
    }
}
