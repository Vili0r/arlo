"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useArloPresenter = useArloPresenter;
const react_1 = require("react");
function useArloPresenter(presenter) {
    const [state, setState] = (0, react_1.useState)(() => presenter.getState());
    (0, react_1.useEffect)(() => presenter.subscribe(setState), [presenter]);
    return state;
}
//# sourceMappingURL=useArloPresenter.js.map