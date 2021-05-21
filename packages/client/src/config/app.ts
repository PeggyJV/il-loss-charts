import defaultConfig from './default';
import production from './production';
import staging from './staging';

import AppConfig, { Environments } from 'types/app-config';

const env = (process.env.REACT_APP_ENV as Environments) ?? process.env.NODE_ENV;

const configEnvs: Partial<{ [env in Environments]: Partial<AppConfig> }> = {
    production,
    staging,
};

const activeConfig: AppConfig = Object.assign(
    {},
    defaultConfig,
    configEnvs[env] || {},
);

export default activeConfig;
