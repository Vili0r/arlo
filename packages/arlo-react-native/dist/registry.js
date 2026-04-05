"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArloRegistry = createArloRegistry;
function createArloRegistry() {
    const screens = new Map();
    const components = new Map();
    return {
        registerScreen(key, renderer) {
            screens.set(key, renderer);
        },
        registerComponent(key, renderer) {
            components.set(key, renderer);
        },
        getScreen(key) {
            return screens.get(key) ?? null;
        },
        getComponent(key) {
            return components.get(key) ?? null;
        },
    };
}
//# sourceMappingURL=registry.js.map