import defaultConfig from './default';
import production from './production';

import AppConfig, { Environments } from 'types/app-config';

const configEnvs: Partial<{ [env in Environments]: Partial<AppConfig> }> = {
    production,
};

const activeConfig: AppConfig = Object.assign(
    {},
    defaultConfig,
    configEnvs[process.env.NODE_ENV] || {}
);

export default activeConfig;
