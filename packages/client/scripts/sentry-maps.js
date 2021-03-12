const SentryCli = require('@sentry/cli');
async function createReleaseAndUpload() {
    const release = process.env.SENTRY_RELEASE;

    const cli = new SentryCli();
    try {
        console.log(`Sentry release version : ${release}`);
        await cli.releases.new(release);
        console.log(`Uploading source maps`);
        await cli.releases.uploadSourceMaps(release, {
            include: ['../build/static/js'],
            urlPrefix: '~/static/js',
            rewrite: false,
        });
        await cli.releases.finalize(release);
    } catch (e) {
        console.error('Source maps uploading failed:', e);
    }
}

void createReleaseAndUpload();
