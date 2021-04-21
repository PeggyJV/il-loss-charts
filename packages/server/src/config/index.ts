import defaultConfig from './default';
import production from './production';
import test from './test';

import AppConfig, { Environments } from 'types/app-config';

const configEnvs: Partial<{ [env in Environments]: Partial<AppConfig> }> = {
    production,
    test,
};

const CURRENT_ENV: Environments =
    (process.env.NODE_ENV as Environments) ?? 'development';

const activeConfig: AppConfig = Object.assign(
    {},
    defaultConfig,
    configEnvs[CURRENT_ENV] ?? {}
);

export default activeConfig;
