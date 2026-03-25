import { useEffect, useState } from "react";

import type { ArloPresentationState, ArloPresenter } from "arlo-sdk";

export function useArloPresenter(presenter: ArloPresenter): ArloPresentationState {
  const [state, setState] = useState<ArloPresentationState>(() => presenter.getState());

  useEffect(() => presenter.subscribe(setState), [presenter]);

  return state;
}
