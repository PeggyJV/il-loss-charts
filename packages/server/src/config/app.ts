// pull in .env files, for backward compat
import dotenv from 'dotenv';
dotenv.config(); // must call before importing config

// Must set this before importing config
process.env.NODE_CONFIG_DIR = __dirname;
// eslint-disable-next-line @typescript-eslint/no-var-requires
let config = require('config');
if (config.default != null) {
    // handle issue with transpiling and nested default
    config = config.default;
}

import defaultConfig from './default';

export type AppConfig = typeof defaultConfig;
const appConfig: AppConfig = config;

export default appConfig;
