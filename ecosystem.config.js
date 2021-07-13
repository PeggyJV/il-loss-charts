const numCores = require("os").cpus().length;
let coreMultiplier = process.env["APP_CORE_MULTIPLIER"];
coreMultiplier = coreMultiplier?.length > 0 ? parseInt(coreMultiplier, 10) : 1;

module.exports = {
  apps: [
    {
      name: "app-server",
      script: "packages/server/dist/www.js",
      cwd: "/app/il-loss-charts",
      exec_mode: "cluster",
      instances: Math.floor(numCores * coreMultiplier),
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
