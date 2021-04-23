import AppConfig from 'types/app-config';
import { RecursivePartial } from 'types/shared';

const config: RecursivePartial<AppConfig> = {
  redis: {
    db: 15, // use last db for tests
  },
  memoizerRedis: {
    enabled: false,
  },
};

export default config;