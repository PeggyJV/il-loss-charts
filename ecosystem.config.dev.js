const numCores = require("os").cpus().length;

module.exports = {
  apps: [
    {
      name: "app-server",
      script: "packages/server/dist/www.js",
      cwd: "/app/il-loss-charts",
      exec_mode: "cluster",
      instances: Math.floor(numCores * 1),
    },
  ],
};
