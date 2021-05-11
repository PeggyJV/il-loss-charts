module.exports = {
    apps: [
        {
            name: 'app-server',
            script: 'packages/server/dist/index.js',
            cwd: '/app/il-loss-charts',
            combine_logs: true,
            out_file: process.env.APP_LOG || './out.log',
            error_file: process.env.APP_ERR_LOG || './err.log',
        },
        {
            name: 'app-worker',
            script: 'packages/workers/dist/scheduler.js',
            cwd: '/app/il-loss-charts',
            combine_logs: true,
            out_file: process.env.APP_LOG || './out.log',
            error_file: process.env.APP_ERR_LOG || './err.log',
        },
    ]
}