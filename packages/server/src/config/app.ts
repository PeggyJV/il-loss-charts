// pull in .env files, for backward compat
import dotenv from 'dotenv';
dotenv.config(); // must call before importing config

// Must set this before importing config
process.env.NODE_CONFIG_DIR = __dirname;
import config from 'config';


import defaultConfig from './default';

export type AppConfig = typeof defaultConfig;
const appConfig: AppConfig = (config as any);

export default appConfig;