// See https://nodejs.org/dist/latest-v16.x/docs/api/process.html#process_process_env
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CDK_DEFAULT_ACCOUNT: string

      CDK_DEFAULT_REGION: string

      DOMAIN_NAME: string

      GOOGLE_VERIFY: string

      VPC_CIDR: string
    }
  }
}

export {}
