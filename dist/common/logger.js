"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const l = pino_1.default({
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL,
});
exports.default = l;
//# sourceMappingURL=logger.js.map