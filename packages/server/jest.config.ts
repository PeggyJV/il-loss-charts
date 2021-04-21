'use strict';

const packageName = 'server';

export default {
  roots: [`<rootDir>/packages/${packageName}`],
  testMatch: [`<rootDir>/packages/${packageName}/test/**/*.spec.ts`],
  moduleDirectories: ['node_modules'],
  modulePaths: [`<rootDir>/packages/${packageName}/src/`],
  name: packageName,
  displayName: packageName,
  rootDir: '../..',
}