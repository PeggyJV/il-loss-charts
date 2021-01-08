import defaultConfig from './default';
import production from './production';

const configEnvs = {
    production,
};

const activeConfig = Object.assign(
    {},
    defaultConfig,
    configEnvs[process.env.NODE_ENV] || {}
);

export default activeConfig;
