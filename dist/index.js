"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("common/env");
const server_1 = __importDefault(require("common/server"));
const server_2 = __importDefault(require("ws/server"));
const routes_1 = __importDefault(require("routes"));
const port = parseInt(process.env.PORT);
const server = new server_1.default().router(routes_1.default).listen(port);
const wsServer = new server_2.default(server);
exports.default = server_1.default;
//# sourceMappingURL=index.js.map