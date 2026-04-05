"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArloPresenter = createArloPresenter;
const bridge_1 = require("./bridge");
const runtime_1 = require("./runtime");
const types_1 = require("./types");
function createInitialState() {
    return {
        status: "idle",
        flowSlug: null,
        response: null,
        session: null,
        error: null,
    };
}
function mapSnapshotStatus(snapshot) {
    if (snapshot.status === "completed") {
        return "completed";
    }
    if (snapshot.status === "dismissed") {
        return "dismissed";
    }
    if (snapshot.status === "active") {
        return "presented";
    }
    return "idle";
}
function createArloPresenter(options) {
    let state = createInitialState();
    const listeners = new Set();
    function notify() {
        for (const listener of listeners) {
            listener(state);
        }
    }
    function setState(updater) {
        state = typeof updater === "function" ? updater(state) : updater;
        notify();
        return state;
    }
    async function presentResolvedFlow(requestedKey, loader, presentOptions = {}) {
        setState((previous) => ({
            ...previous,
            status: "loading",
            flowSlug: requestedKey,
            error: null,
        }));
        try {
            const response = await loader();
            const session = (0, runtime_1.createFlowSession)(response, {
                identity: options.client.getIdentity(),
                initialValues: presentOptions.initialValues,
            });
            const effect = session.start();
            await (0, bridge_1.applyFlowSessionEffect)(session, effect, options.handlers);
            const snapshot = session.getSnapshot();
            const nextStatus = snapshot.status === "dismissed"
                ? "dismissed"
                : snapshot.status === "completed"
                    ? "completed"
                    : "presented";
            return setState({
                status: nextStatus,
                flowSlug: response.flow.slug,
                response,
                session,
                error: null,
            });
        }
        catch (error) {
            const sdkError = error instanceof types_1.ArloSDKError
                ? error
                : new types_1.ArloSDKError("Failed to present flow");
            return setState({
                status: "error",
                flowSlug: requestedKey,
                response: null,
                session: null,
                error: sdkError,
            });
        }
    }
    return {
        getState() {
            return state;
        },
        async presentFlow(slug, presentOptions = {}) {
            return presentResolvedFlow(slug, () => options.client.getFlow(slug, presentOptions), presentOptions);
        },
        presentEntryPoint(entryPointKey, presentOptions = {}) {
            return presentResolvedFlow(entryPointKey, () => options.client.getEntryPoint(entryPointKey, presentOptions), presentOptions);
        },
        preloadFlow(slug) {
            return options.client.preloadFlow(slug);
        },
        preloadEntryPoint(entryPointKey) {
            return options.client.preloadEntryPoint(entryPointKey);
        },
        async dismiss() {
            if (!state.session) {
                return state;
            }
            const effect = state.session.dismiss();
            await (0, bridge_1.applyFlowSessionEffect)(state.session, effect, options.handlers);
            return setState((previous) => ({
                ...previous,
                status: "dismissed",
            }));
        },
        syncSession() {
            if (!state.session) {
                return state;
            }
            const snapshot = state.session.getSnapshot();
            return setState((previous) => ({
                ...previous,
                status: mapSnapshotStatus(snapshot),
            }));
        },
        clear() {
            return setState(createInitialState());
        },
        subscribe(listener) {
            listeners.add(listener);
            listener(state);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
//# sourceMappingURL=presenter.js.map