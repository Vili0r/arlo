import type { z } from "zod";

import type { buttonActionSchema } from "./schema";
import type {
  ArloIdentifyInput,
  FlowComponent,
  FlowConfig,
  Screen,
  SDKFlowResponse,
} from "./types";
import { ArloSDKError } from "./types";

type ButtonAction = z.infer<typeof buttonActionSchema>;
type FlowValue = string | string[] | number | boolean | null | undefined;

export interface FlowSessionOptions {
  initialValues?: Record<string, FlowValue>;
  identity?: ArloIdentifyInput | null;
}

export type FlowSessionStatus = "idle" | "active" | "completed" | "dismissed";

export interface FlowFieldError {
  fieldKey: string;
  componentId: string;
  message: string;
}

export type FlowSessionEffect =
  | { type: "screen_changed"; screenId: string; screenIndex: number }
  | { type: "completed"; screenId: string; screenIndex: number }
  | { type: "dismissed"; screenId: string; screenIndex: number }
  | { type: "validation_failed"; errors: FlowFieldError[] }
  | { type: "open_url"; url: string }
  | { type: "deep_link"; url: string }
  | { type: "custom_event"; eventName: string }
  | { type: "request_notifications" }
  | { type: "request_tracking" }
  | { type: "restore_purchases" }
  | { type: "noop" };

export interface FlowSessionSnapshot {
  flowSlug: string;
  flowVersion: number;
  status: FlowSessionStatus;
  currentScreenId: string | null;
  currentScreenIndex: number;
  currentScreen: Screen | null;
  totalScreens: number;
  values: Record<string, FlowValue>;
  visibleScreenIds: string[];
  identity: ArloIdentifyInput | null;
  validationErrors: FlowFieldError[];
  validationErrorsByField: Record<string, string>;
  isCurrentScreenValid: boolean;
}

export interface FlowSession {
  start(): FlowSessionEffect;
  getSnapshot(): FlowSessionSnapshot;
  getCurrentScreen(): Screen | null;
  getVisibleScreens(): Screen[];
  getValue(fieldKey: string): FlowValue;
  setValue(fieldKey: string, value: FlowValue): FlowSessionSnapshot;
  validateCurrentScreen(): FlowFieldError[];
  canContinue(): boolean;
  goToScreenId(screenId: string): FlowSessionEffect;
  next(): FlowSessionEffect;
  previous(): FlowSessionEffect;
  dismiss(): FlowSessionEffect;
  pressButton(componentId: string): FlowSessionEffect;
}

function sortScreens(config: FlowConfig): Screen[] {
  return [...config.screens].sort((a, b) => a.order - b.order);
}

function isValueSet(value: FlowValue): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function compareRuleValue(
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "is_set" | "is_not_set",
  actual: FlowValue,
  expected?: string | string[]
): boolean {
  switch (operator) {
    case "is_set":
      return isValueSet(actual);
    case "is_not_set":
      return !isValueSet(actual);
    case "equals":
      if (Array.isArray(actual)) {
        return Array.isArray(expected)
          ? actual.length === expected.length && actual.every((value, index) => value === expected[index])
          : actual.includes(String(expected ?? ""));
      }
      return String(actual ?? "") === String(expected ?? "");
    case "not_equals":
      return !compareRuleValue("equals", actual, expected);
    case "contains":
      if (Array.isArray(actual)) {
        if (Array.isArray(expected)) {
          return expected.every((value) => actual.includes(value));
        }
        return actual.includes(String(expected ?? ""));
      }
      return String(actual ?? "").includes(String(expected ?? ""));
    case "not_contains":
      return !compareRuleValue("contains", actual, expected);
    default:
      return false;
  }
}

function shouldSkipScreen(screen: Screen, values: Record<string, FlowValue>): boolean {
  const conditions = screen.skipWhen ?? [];
  if (conditions.length === 0) {
    return false;
  }

  return conditions.every((condition) =>
    compareRuleValue(condition.operator, values[condition.fieldKey], condition.value)
  );
}

function getVisibleScreens(screens: Screen[], values: Record<string, FlowValue>): Screen[] {
  return screens.filter((screen) => !shouldSkipScreen(screen, values));
}

function findScreenIndexById(screens: Screen[], screenId: string): number {
  return screens.findIndex((screen) => screen.id === screenId);
}

function normalizeTargetScreenIndex(
  visibleScreens: Screen[],
  orderedScreens: Screen[],
  targetScreenId: string
): number {
  const visibleIndex = findScreenIndexById(visibleScreens, targetScreenId);
  if (visibleIndex >= 0) {
    return visibleIndex;
  }

  const orderedIndex = findScreenIndexById(orderedScreens, targetScreenId);
  if (orderedIndex < 0) {
    return -1;
  }

  for (let index = orderedIndex + 1; index < orderedScreens.length; index += 1) {
    const candidateVisibleIndex = findScreenIndexById(visibleScreens, orderedScreens[index].id);
    if (candidateVisibleIndex >= 0) {
      return candidateVisibleIndex;
    }
  }

  for (let index = orderedIndex - 1; index >= 0; index -= 1) {
    const candidateVisibleIndex = findScreenIndexById(visibleScreens, orderedScreens[index].id);
    if (candidateVisibleIndex >= 0) {
      return candidateVisibleIndex;
    }
  }

  return -1;
}

function getButtonTargetIndex(
  action: ButtonAction,
  props: Extract<FlowComponent, { type: "BUTTON" }>["props"],
  visibleScreens: Screen[],
  orderedScreens: Screen[],
  currentScreenIndex: number
): number | null {
  if (action === "NEXT_SCREEN" || action === "PREV_SCREEN") {
    if (props.actionTarget === "first") {
      return visibleScreens.length > 0 ? 0 : null;
    }

    if (props.actionTarget === "last") {
      return visibleScreens.length > 0 ? visibleScreens.length - 1 : null;
    }

    if (props.actionTarget === "specific" && props.actionTargetScreenId) {
      const resolved = normalizeTargetScreenIndex(
        visibleScreens,
        orderedScreens,
        props.actionTargetScreenId
      );
      return resolved >= 0 ? resolved : null;
    }
  }

  if (action === "PREV_SCREEN") {
    return currentScreenIndex > 0 ? currentScreenIndex - 1 : null;
  }

  return null;
}

function getBranchTargetIndex(
  currentScreen: Screen,
  visibleScreens: Screen[],
  orderedScreens: Screen[],
  values: Record<string, FlowValue>,
  fallbackIndex: number
): number {
  for (const rule of currentScreen.branchRules ?? []) {
    if (compareRuleValue(rule.operator, values[rule.fieldKey], rule.value)) {
      const targetIndex = normalizeTargetScreenIndex(
        visibleScreens,
        orderedScreens,
        rule.targetScreenId
      );

      if (targetIndex >= 0) {
        return targetIndex;
      }
    }
  }

  return fallbackIndex;
}

function createSnapshot(
  response: SDKFlowResponse,
  visibleScreens: Screen[],
  currentScreenIndex: number,
  status: FlowSessionStatus,
  values: Record<string, FlowValue>,
  identity: ArloIdentifyInput | null,
  validationErrors: FlowFieldError[]
): FlowSessionSnapshot {
  const currentScreen = visibleScreens[currentScreenIndex] ?? null;
  const validationErrorsByField = Object.fromEntries(
    validationErrors.map((error) => [error.fieldKey, error.message])
  );

  return {
    flowSlug: response.flow.slug,
    flowVersion: response.flow.version,
    status,
    currentScreenId: currentScreen?.id ?? null,
    currentScreenIndex,
    currentScreen,
    totalScreens: visibleScreens.length,
    values: { ...values },
    visibleScreenIds: visibleScreens.map((screen) => screen.id),
    identity,
    validationErrors: [...validationErrors],
    validationErrorsByField,
    isCurrentScreenValid: validationErrors.length === 0,
  };
}

export function createFlowSession(
  response: SDKFlowResponse,
  options: FlowSessionOptions = {}
): FlowSession {
  const orderedScreens = sortScreens(response.flow.config);
  if (orderedScreens.length === 0) {
    throw new ArloSDKError("Flow config must contain at least one screen");
  }

  let values: Record<string, FlowValue> = { ...(options.initialValues ?? {}) };
  let identity = options.identity ?? null;
  let status: FlowSessionStatus = "idle";
  let visibleScreens = getVisibleScreens(orderedScreens, values);
  let currentScreenIndex = visibleScreens.length > 0 ? 0 : -1;
  let validationErrors: FlowFieldError[] = [];

  function validateScreen(screen: Screen | null): FlowFieldError[] {
    if (!screen) {
      return [];
    }

    const errors: FlowFieldError[] = [];

    for (const component of screen.components) {
      switch (component.type) {
        case "TEXT_INPUT": {
          const value = values[component.props.fieldKey];

          if (component.props.required && !isValueSet(value)) {
            errors.push({
              fieldKey: component.props.fieldKey,
              componentId: component.id,
              message: `${component.props.label ?? "This field"} is required`,
            });
          }

          if (
            typeof value === "string" &&
            component.props.maxLength &&
            value.length > component.props.maxLength
          ) {
            errors.push({
              fieldKey: component.props.fieldKey,
              componentId: component.id,
              message: `${component.props.label ?? "This field"} must be ${component.props.maxLength} characters or fewer`,
            });
          }
          break;
        }
        case "SINGLE_SELECT": {
          const value = values[component.props.fieldKey];
          if (component.props.required && !isValueSet(value)) {
            errors.push({
              fieldKey: component.props.fieldKey,
              componentId: component.id,
              message: component.props.label ?? "Please select an option",
            });
          }
          break;
        }
        case "MULTI_SELECT": {
          const rawValue = values[component.props.fieldKey];
          const selections = Array.isArray(rawValue)
            ? rawValue.filter((item): item is string => typeof item === "string")
            : [];

          if (component.props.required && selections.length === 0) {
            errors.push({
              fieldKey: component.props.fieldKey,
              componentId: component.id,
              message: component.props.label ?? "Please select at least one option",
            });
          }

          if (
            typeof component.props.minSelections === "number" &&
            selections.length < component.props.minSelections
          ) {
            errors.push({
              fieldKey: component.props.fieldKey,
              componentId: component.id,
              message: `Select at least ${component.props.minSelections} option${component.props.minSelections === 1 ? "" : "s"}`,
            });
          }

          if (
            typeof component.props.maxSelections === "number" &&
            selections.length > component.props.maxSelections
          ) {
            errors.push({
              fieldKey: component.props.fieldKey,
              componentId: component.id,
              message: `Select no more than ${component.props.maxSelections} option${component.props.maxSelections === 1 ? "" : "s"}`,
            });
          }
          break;
        }
        default:
          break;
      }
    }

    return errors;
  }

  function refreshVisibleScreens(): void {
    const previousScreenId = visibleScreens[currentScreenIndex]?.id ?? null;
    visibleScreens = getVisibleScreens(orderedScreens, values);

    if (visibleScreens.length === 0) {
      currentScreenIndex = -1;
      return;
    }

    if (previousScreenId) {
      const newIndex = findScreenIndexById(visibleScreens, previousScreenId);
      if (newIndex >= 0) {
        currentScreenIndex = newIndex;
        return;
      }
    }

    currentScreenIndex = Math.min(
      Math.max(currentScreenIndex, 0),
      visibleScreens.length - 1
    );

    validationErrors = validateScreen(visibleScreens[currentScreenIndex] ?? null);
  }

  function readCurrentScreen(): Screen | null {
    return visibleScreens[currentScreenIndex] ?? null;
  }

  function goToIndex(nextIndex: number): FlowSessionEffect {
    if (nextIndex < 0 || nextIndex >= visibleScreens.length) {
      status = "completed";
      const current = readCurrentScreen();
      return {
        type: "completed",
        screenId: current?.id ?? "",
        screenIndex: currentScreenIndex,
      };
    }

    currentScreenIndex = nextIndex;
    status = "active";
    return {
      type: "screen_changed",
      screenId: visibleScreens[nextIndex].id,
      screenIndex: nextIndex,
    };
  }

  function next(): FlowSessionEffect {
    refreshVisibleScreens();
    const current = readCurrentScreen();

    if (!current) {
      status = "completed";
      return {
        type: "completed",
        screenId: "",
        screenIndex: -1,
      };
    }

    validationErrors = validateScreen(current);
    if (validationErrors.length > 0) {
      return {
        type: "validation_failed",
        errors: [...validationErrors],
      };
    }

    const fallbackIndex = currentScreenIndex + 1;
    const targetIndex = getBranchTargetIndex(
      current,
      visibleScreens,
      orderedScreens,
      values,
      fallbackIndex
    );

    return goToIndex(targetIndex);
  }

  function previous(): FlowSessionEffect {
    refreshVisibleScreens();
    if (currentScreenIndex <= 0) {
      return { type: "noop" };
    }

    return goToIndex(currentScreenIndex - 1);
  }

  function dismiss(): FlowSessionEffect {
    const current = readCurrentScreen();
    status = "dismissed";

    return {
      type: "dismissed",
      screenId: current?.id ?? "",
      screenIndex: currentScreenIndex,
    };
  }

  function pressButton(componentId: string): FlowSessionEffect {
    refreshVisibleScreens();
    const current = readCurrentScreen();
    if (!current) {
      throw new ArloSDKError("Cannot press a button when there is no active screen");
    }

    const component = current.components.find(
      (item): item is Extract<FlowComponent, { type: "BUTTON" }> =>
        item.id === componentId && item.type === "BUTTON"
    );

    if (!component) {
      throw new ArloSDKError(`Button component "${componentId}" was not found on the current screen`);
    }

    const explicitTargetIndex = getButtonTargetIndex(
      component.props.action,
      component.props,
      visibleScreens,
      orderedScreens,
      currentScreenIndex
    );

    switch (component.props.action) {
      case "NEXT_SCREEN":
        validationErrors = validateScreen(current);
        if (validationErrors.length > 0) {
          return {
            type: "validation_failed",
            errors: [...validationErrors],
          };
        }

        if (explicitTargetIndex !== null) {
          return goToIndex(explicitTargetIndex);
        }
        return next();
      case "PREV_SCREEN":
        if (explicitTargetIndex !== null) {
          return goToIndex(explicitTargetIndex);
        }
        return previous();
      case "SKIP_FLOW":
      case "CLOSE_FLOW":
        status = "completed";
        return {
          type: "completed",
          screenId: current.id,
          screenIndex: currentScreenIndex,
        };
      case "DISMISS":
        return dismiss();
      case "OPEN_URL":
        return { type: "open_url", url: component.props.url! };
      case "DEEP_LINK":
        return { type: "deep_link", url: component.props.deepLinkUrl! };
      case "CUSTOM_EVENT":
        return { type: "custom_event", eventName: component.props.eventName! };
      case "REQUEST_NOTIFICATIONS":
        return { type: "request_notifications" };
      case "REQUEST_TRACKING":
        return { type: "request_tracking" };
      case "RESTORE_PURCHASES":
        return { type: "restore_purchases" };
      default:
        return { type: "noop" };
    }
  }

  return {
    start(): FlowSessionEffect {
      refreshVisibleScreens();
      status = visibleScreens.length > 0 ? "active" : "completed";

      if (visibleScreens.length === 0) {
        return {
          type: "completed",
          screenId: "",
          screenIndex: -1,
        };
      }

      return {
        type: "screen_changed",
        screenId: visibleScreens[currentScreenIndex].id,
        screenIndex: currentScreenIndex,
      };
    },
    getSnapshot(): FlowSessionSnapshot {
      refreshVisibleScreens();
      return createSnapshot(
        response,
        visibleScreens,
        currentScreenIndex,
        status,
        values,
        identity,
        validationErrors
      );
    },
    validateCurrentScreen(): FlowFieldError[] {
      refreshVisibleScreens();
      validationErrors = validateScreen(readCurrentScreen());
      return [...validationErrors];
    },
    canContinue(): boolean {
      refreshVisibleScreens();
      validationErrors = validateScreen(readCurrentScreen());
      return validationErrors.length === 0;
    },
    getCurrentScreen(): Screen | null {
      refreshVisibleScreens();
      return readCurrentScreen();
    },
    getVisibleScreens(): Screen[] {
      refreshVisibleScreens();
      return [...visibleScreens];
    },
    getValue(fieldKey: string): FlowValue {
      return values[fieldKey];
    },
    setValue(fieldKey: string, value: FlowValue): FlowSessionSnapshot {
      values = {
        ...values,
        [fieldKey]: value,
      };

      refreshVisibleScreens();
      return createSnapshot(
        response,
        visibleScreens,
        currentScreenIndex,
        status,
        values,
        identity,
        validationErrors
      );
    },
    goToScreenId(screenId: string): FlowSessionEffect {
      refreshVisibleScreens();
      const targetIndex = normalizeTargetScreenIndex(visibleScreens, orderedScreens, screenId);
      if (targetIndex < 0) {
        throw new ArloSDKError(`Screen "${screenId}" was not found in the active flow`);
      }

      return goToIndex(targetIndex);
    },
    next,
    previous,
    dismiss,
    pressButton,
  };
}
