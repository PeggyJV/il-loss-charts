"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line no-unused-vars, no-shadow
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    const errors = err.errors || [{ message: err.message }];
    res.status(err.status || 500).json({ errors });
}
exports.default = errorHandler;
//# sourceMappingURL=error.handler.js.map