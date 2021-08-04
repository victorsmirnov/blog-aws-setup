import {Construct} from "@aws-cdk/core";
import {KeyPair} from "cdk-ec2-key-pair";

/**
 * We plan to use the key for our EC2 instance running Ghost server.
 */
export class SshKey extends KeyPair {
    constructor(scope: Construct) {
        super(scope, "KeyPair", {
            name: "blog-key",
            description: "Key Pair created with CDK Deployment",
        });
    }
}
