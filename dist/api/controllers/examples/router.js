"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = __importDefault(require("./controller"));
exports.default = express_1.default
    .Router()
    .post('/', controller_1.default.create)
    .get('/', controller_1.default.all)
    .get('/:id', controller_1.default.byId);
//# sourceMappingURL=router.js.map