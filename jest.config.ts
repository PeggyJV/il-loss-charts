import baseConfig from './jest.config.base';
export default {
    ...baseConfig,
    projects: ['<rootDir>/packages/*/jest.config.ts'],
};
