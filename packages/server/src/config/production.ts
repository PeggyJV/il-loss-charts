import AppConfig from 'types/app-config';
import { RecursivePartial } from 'types/shared';

const config: RecursivePartial<AppConfig> = {
    redis: {
        host: '10.5.80.12',
        port: 6379
    },
};

export default config;
