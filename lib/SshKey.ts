import {Construct} from "@aws-cdk/core";
import {KeyPair} from "cdk-ec2-key-pair";

/**
 * SSH key for the web server (EC2 instance).
 * Key is created as a custom resource using Lambda function. The SSH private key is saved as a secret
 * and can downloaded at any time.
 */
export function sshKey(scope: Construct): KeyPair {
    return new KeyPair(scope, "KeyPair", {
        name: "blog-key",
        description: "Key Pair created with CDK Deployment",
    });
}
