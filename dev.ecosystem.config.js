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
    },
  ],
};
