"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArloSDKError = void 0;
class ArloSDKError extends Error {
    constructor(message, options) {
        super(message);
        this.name = "ArloSDKError";
        this.status = options?.status ?? 0;
        this.code = options?.code;
    }
}
exports.ArloSDKError = ArloSDKError;
//# sourceMappingURL=types.js.map