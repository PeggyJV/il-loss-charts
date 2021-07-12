const numCores = require('os').cpus().length;

module.exports = {
  apps: [
    {
      name: "app-server",
      script: "packages/server/dist/www.js",
      cwd: "/app/il-loss-charts",
      exec_mode: 'cluster',
      instances: Math.floor(numCores * 1.5), // should be able to run more instances than cores due to interleaving
      combine_logs: true,
      out_file: process.env.APP_LOG || "./out.log",
      error_file: process.env.APP_ERR_LOG || "./err.log",
    },
    {
      name: "app-worker",
      script: "packages/workers/dist/scheduler.js",
      cwd: "/app/il-loss-charts",
      combine_logs: true,
      out_file: process.env.APP_LOG || "./out.log",
      error_file: process.env.APP_ERR_LOG || "./err.log",
    },
  ],
};
