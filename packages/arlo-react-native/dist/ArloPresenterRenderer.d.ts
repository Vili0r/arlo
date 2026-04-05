import type { ReactNode } from "react";
import type { ArloPresenter } from "arlo-sdk";
import type { ArloFlowRendererProps } from "./types";
export interface ArloPresenterRendererProps extends Omit<ArloFlowRendererProps, "session"> {
    presenter: ArloPresenter;
    loadingState?: ReactNode;
    errorState?: (message: string) => ReactNode;
}
export declare function ArloPresenterRenderer({ presenter, loadingState, errorState, ...rendererProps }: ArloPresenterRendererProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ArloPresenterRenderer.d.ts.map