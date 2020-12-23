"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = __importDefault(require("./api/controllers/examples/router"));
function routes(app) {
    app.use('/api/v1/examples', router_1.default);
}
exports.default = routes;
//# sourceMappingURL=routes.js.map