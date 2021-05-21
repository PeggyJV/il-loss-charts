import { RecursivePartial } from 'types/shared';

import type { AppConfig } from 'config/app';

const config: RecursivePartial<AppConfig> = {
    redis: {
        db: 15, // use last db for tests
    },
    memoizerRedis: {
        enabled: false,
    },
};

export default config;
