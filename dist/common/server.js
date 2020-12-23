"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const os_1 = __importDefault(require("os"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const logger_1 = __importDefault(require("./logger"));
const error_handler_1 = __importDefault(require("../api/middlewares/error.handler"));
const OpenApiValidator = __importStar(require("express-openapi-validator"));
const app = express_1.default();
class ExpressServer {
    constructor() {
        const root = path_1.default.normalize(__dirname + '/../..');
        app.set('appPath', root + 'client');
        app.use(body_parser_1.default.json({ limit: process.env.REQUEST_LIMIT || '100kb' }));
        app.use(body_parser_1.default.urlencoded({
            extended: true,
            limit: process.env.REQUEST_LIMIT || '100kb',
        }));
        app.use(body_parser_1.default.text({ limit: process.env.REQUEST_LIMIT || '100kb' }));
        app.use(cookie_parser_1.default(process.env.SESSION_SECRET));
        app.use(express_1.default.static(`${root}/public`));
        const apiSpec = path_1.default.join(__dirname, 'api.yml');
        const validateResponses = !!(process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
            process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === 'true');
        app.use(process.env.OPENAPI_SPEC || '/spec', express_1.default.static(apiSpec));
        app.use(OpenApiValidator.middleware({
            apiSpec,
            validateResponses,
            ignorePaths: /.*\/spec(\/|$)/,
        }));
    }
    router(routes) {
        routes(app);
        app.use(error_handler_1.default);
        return this;
    }
    listen(port) {
        const welcome = (p) => () => logger_1.default.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os_1.default.hostname()} on port: ${p}}`);
        http_1.default.createServer(app).listen(port, welcome(port));
        return app;
    }
}
exports.default = ExpressServer;
//# sourceMappingURL=server.js.map