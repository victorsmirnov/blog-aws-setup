// See https://nodejs.org/dist/latest-v16.x/docs/api/process.html#process_process_env
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            AWS_ACCOUNT: string;

            AWS_REGION: string;

            DOMAIN_NAME: string;

            GOOGLE_VERIFY: string;

            VPC_CIDR: string;
        }
    }
}

export {};
