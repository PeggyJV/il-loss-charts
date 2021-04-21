'use strict';

import baseConfig from '../../jest.config.base';
const packageName = 'server';

export default {
  ...baseConfig,
  roots: [`<rootDir>/packages/${packageName}`],
  testMatch: [`<rootDir>/packages/${packageName}/test/**/*.spec.ts`],
  moduleDirectories: ['node_modules'],
  modulePaths: [`<rootDir>/packages/${packageName}/src/`],
  name: packageName,
  displayName: packageName,
  rootDir: '../..',
}

