"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArloPresenterRenderer = ArloPresenterRenderer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ArloFlowRenderer_1 = require("./ArloFlowRenderer");
const useArloPresenter_1 = require("./useArloPresenter");
function ArloPresenterRenderer({ presenter, loadingState = ((0, jsx_runtime_1.jsx)(react_native_1.View, { children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { children: "Loading..." }) })), errorState, ...rendererProps }) {
    const state = (0, useArloPresenter_1.useArloPresenter)(presenter);
    if (state.status === "loading") {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: loadingState });
    }
    if (state.status === "error") {
        if (errorState) {
            return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: errorState(state.error?.message ?? "Unknown error") });
        }
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { children: state.error?.message ?? "Failed to load flow" }) }));
    }
    if (!state.session) {
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: rendererProps.emptyState ?? null });
    }
    return ((0, jsx_runtime_1.jsx)(ArloFlowRenderer_1.ArloFlowRenderer, { session: state.session, ...rendererProps, onSnapshotChange: (snapshot) => {
            rendererProps.onSnapshotChange?.(snapshot);
            presenter.syncSession();
        } }));
}
//# sourceMappingURL=ArloPresenterRenderer.js.map