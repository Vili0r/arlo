"use client";

import { useCallback, useReducer } from "react";

const MAX_HISTORY = 100;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  saved: T;
}

type HistoryAction<T> =
  | { type: "SET"; next: T | ((prev: T) => T); batch?: boolean }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; value: T }
  | { type: "MARK_SAVED" };

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case "SET": {
      const next =
        typeof action.next === "function"
          ? (action.next as (prev: T) => T)(state.present)
          : action.next;
      if (action.batch) {
        return { ...state, present: next };
      }
      const newPast = [...state.past, state.present];
      return {
        ...state,
        past: newPast.length > MAX_HISTORY ? newPast.slice(-MAX_HISTORY) : newPast,
        present: next,
        future: [],
      };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }
    case "RESET": {
      return { past: [], present: action.value, future: [], saved: action.value };
    }
    case "MARK_SAVED": {
      return { ...state, saved: state.present };
    }
    default:
      return state;
  }
}

/**
 * Generic undo/redo hook using useReducer for atomic state updates.
 *
 * Usage:
 *   const history = useHistory(initialConfig);
 *   history.state          // current value
 *   history.set(updater)   // like setState — pushes a snapshot
 *   history.undo()
 *   history.redo()
 *   history.canUndo / history.canRedo
 *   history.isDirty        // true if state differs from last saved snapshot
 *   history.markSaved()    // call after a successful save
 */
export function useHistory<T>(initial: T) {
  const [state, dispatch] = useReducer(historyReducer<T>, {
    past: [],
    present: initial,
    future: [],
    saved: initial,
  });

  const set = useCallback(
    (
      updater: T | ((prev: T) => T),
      opts?: { batch?: boolean },
    ) => {
      dispatch({ type: "SET", next: updater, batch: opts?.batch });
    },
    [],
  );

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const markSaved = useCallback(() => dispatch({ type: "MARK_SAVED" }), []);

  const reset = useCallback((value: T) => {
    dispatch({ type: "RESET", value });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    reset,
    markSaved,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    isDirty: state.present !== state.saved,
    historyLength: state.past.length,
  };
}
