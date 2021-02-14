export type Environments = 'production' | 'development' | 'test' | 'staging';

export default interface AppConfig {
    redisHost: string;
    redisPort: number;
}
