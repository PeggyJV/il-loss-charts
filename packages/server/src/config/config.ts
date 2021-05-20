import 'common/env';
import { RecursivePartial } from 'types/shared';
import defaultConfig from './default';
import production from './production';
import staging from './staging';
import test from './test';

import AppConfig, { Environments } from 'types/app-config';

const configEnvs: Partial<{ [env in Environments]: RecursivePartial<AppConfig> }> = {
    production,
    staging,
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
