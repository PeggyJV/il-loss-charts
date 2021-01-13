import s from 'shelljs';
import config from './tsconfig.json';
const outDir = config.compilerOptions.outDir;

s.cp('.env', `${outDir}/.env`);
s.mkdir('-p', `${outDir}/docs/`);
s.cp('src/docs/api.yml', `${outDir}/docs/api.yml`);
