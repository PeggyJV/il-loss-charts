import defaultConfig from './default';
import production from './production';

import AppConfig, { Environments } from 'types/app-config';

const configEnvs: Partial<{ [env in Environments]: Partial<AppConfig> }> = {
    production,
};

const CURRENT_ENV: Environments =
    (process.env.NODE_ENV as Environments) || 'development';

const activeConfig: AppConfig = Object.assign(
    {},
    defaultConfig,
    configEnvs[CURRENT_ENV] || {}
);

export default activeConfig;
