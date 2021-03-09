export type Environments = 'production' | 'development' | 'test' | 'staging';

export default interface AppConfig {
    redisHost: string;
    redisPort: number;
    port: string;
    requestLimit: string;
    openApiSpec: string;
    enableResponseValidation: boolean;
}
