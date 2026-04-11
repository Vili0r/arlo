"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFlowSession = createFlowSession;
const types_1 = require("./types");
function sortScreens(config) {
    return [...config.screens].sort((a, b) => a.order - b.order);
}
function isValueSet(value) {
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
function compareRuleValue(operator, actual, expected) {
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
function shouldSkipScreen(screen, values) {
    const conditions = screen.skipWhen ?? [];
    if (conditions.length === 0) {
        return false;
    }
    return conditions.every((condition) => compareRuleValue(condition.operator, values[condition.fieldKey], condition.value));
}
function getVisibleScreens(screens, values) {
    return screens.filter((screen) => !shouldSkipScreen(screen, values));
}
function findScreenIndexById(screens, screenId) {
    return screens.findIndex((screen) => screen.id === screenId);
}
function normalizeTargetScreenIndex(visibleScreens, orderedScreens, targetScreenId) {
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
function getButtonTargetIndex(action, props, visibleScreens, orderedScreens, currentScreenIndex) {
    if (action === "NEXT_SCREEN" || action === "PREV_SCREEN") {
        if (props.actionTarget === "previous") {
            return currentScreenIndex > 0 ? currentScreenIndex - 1 : null;
        }
        if (props.actionTarget === "first") {
            return visibleScreens.length > 0 ? 0 : null;
        }
        if (props.actionTarget === "last") {
            return visibleScreens.length > 0 ? visibleScreens.length - 1 : null;
        }
        if (props.actionTarget === "specific" && props.actionTargetScreenId) {
            const resolved = normalizeTargetScreenIndex(visibleScreens, orderedScreens, props.actionTargetScreenId);
            return resolved >= 0 ? resolved : null;
        }
    }
    if (action === "PREV_SCREEN") {
        return currentScreenIndex > 0 ? currentScreenIndex - 1 : null;
    }
    return null;
}
function getBranchTargetIndex(currentScreen, visibleScreens, orderedScreens, values, fallbackIndex) {
    for (const rule of currentScreen.branchRules ?? []) {
        if (compareRuleValue(rule.operator, values[rule.fieldKey], rule.value)) {
            const targetIndex = normalizeTargetScreenIndex(visibleScreens, orderedScreens, rule.targetScreenId);
            if (targetIndex >= 0) {
                return targetIndex;
            }
        }
    }
    return fallbackIndex;
}
function createSnapshot(response, visibleScreens, currentScreenIndex, status, values, identity, validationErrors) {
    const currentScreen = visibleScreens[currentScreenIndex] ?? null;
    const validationErrorsByField = Object.fromEntries(validationErrors.map((error) => [error.fieldKey, error.message]));
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
function createFlowSession(response, options = {}) {
    const orderedScreens = sortScreens(response.flow.config);
    if (orderedScreens.length === 0) {
        throw new types_1.ArloSDKError("Flow config must contain at least one screen");
    }
    let values = { ...(options.initialValues ?? {}) };
    let identity = options.identity ?? null;
    let status = "idle";
    let visibleScreens = getVisibleScreens(orderedScreens, values);
    let currentScreenIndex = visibleScreens.length > 0 ? 0 : -1;
    let validationErrors = [];
    function validateScreen(screen) {
        if (!screen) {
            return [];
        }
        const errors = [];
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
                    if (typeof value === "string" &&
                        component.props.maxLength &&
                        value.length > component.props.maxLength) {
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
                        ? rawValue.filter((item) => typeof item === "string")
                        : [];
                    if (component.props.required && selections.length === 0) {
                        errors.push({
                            fieldKey: component.props.fieldKey,
                            componentId: component.id,
                            message: component.props.label ?? "Please select at least one option",
                        });
                    }
                    if (typeof component.props.minSelections === "number" &&
                        selections.length < component.props.minSelections) {
                        errors.push({
                            fieldKey: component.props.fieldKey,
                            componentId: component.id,
                            message: `Select at least ${component.props.minSelections} option${component.props.minSelections === 1 ? "" : "s"}`,
                        });
                    }
                    if (typeof component.props.maxSelections === "number" &&
                        selections.length > component.props.maxSelections) {
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
    function refreshVisibleScreens() {
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
        currentScreenIndex = Math.min(Math.max(currentScreenIndex, 0), visibleScreens.length - 1);
        validationErrors = validateScreen(visibleScreens[currentScreenIndex] ?? null);
    }
    function readCurrentScreen() {
        return visibleScreens[currentScreenIndex] ?? null;
    }
    function goToIndex(nextIndex) {
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
    function next() {
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
        const targetIndex = getBranchTargetIndex(current, visibleScreens, orderedScreens, values, fallbackIndex);
        return goToIndex(targetIndex);
    }
    function previous() {
        refreshVisibleScreens();
        if (currentScreenIndex <= 0) {
            return { type: "noop" };
        }
        return goToIndex(currentScreenIndex - 1);
    }
    function dismiss() {
        const current = readCurrentScreen();
        status = "dismissed";
        return {
            type: "dismissed",
            screenId: current?.id ?? "",
            screenIndex: currentScreenIndex,
        };
    }
    function pressButton(componentId) {
        refreshVisibleScreens();
        const current = readCurrentScreen();
        if (!current) {
            throw new types_1.ArloSDKError("Cannot press a button when there is no active screen");
        }
        const component = current.components.find((item) => item.id === componentId && item.type === "BUTTON");
        if (!component) {
            throw new types_1.ArloSDKError(`Button component "${componentId}" was not found on the current screen`);
        }
        const explicitTargetIndex = getButtonTargetIndex(component.props.action, component.props, visibleScreens, orderedScreens, currentScreenIndex);
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
                return { type: "open_url", url: component.props.url };
            case "DEEP_LINK":
                return { type: "deep_link", url: component.props.deepLinkUrl };
            case "CUSTOM_EVENT":
                return { type: "custom_event", eventName: component.props.eventName };
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
        start() {
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
        getSnapshot() {
            refreshVisibleScreens();
            return createSnapshot(response, visibleScreens, currentScreenIndex, status, values, identity, validationErrors);
        },
        validateCurrentScreen() {
            refreshVisibleScreens();
            validationErrors = validateScreen(readCurrentScreen());
            return [...validationErrors];
        },
        canContinue() {
            refreshVisibleScreens();
            validationErrors = validateScreen(readCurrentScreen());
            return validationErrors.length === 0;
        },
        getCurrentScreen() {
            refreshVisibleScreens();
            return readCurrentScreen();
        },
        getVisibleScreens() {
            refreshVisibleScreens();
            return [...visibleScreens];
        },
        getValue(fieldKey) {
            return values[fieldKey];
        },
        setValue(fieldKey, value) {
            values = {
                ...values,
                [fieldKey]: value,
            };
            refreshVisibleScreens();
            return createSnapshot(response, visibleScreens, currentScreenIndex, status, values, identity, validationErrors);
        },
        goToScreenId(screenId) {
            refreshVisibleScreens();
            const targetIndex = normalizeTargetScreenIndex(visibleScreens, orderedScreens, screenId);
            if (targetIndex < 0) {
                throw new types_1.ArloSDKError(`Screen "${screenId}" was not found in the active flow`);
            }
            return goToIndex(targetIndex);
        },
        next,
        previous,
        dismiss,
        pressButton,
    };
}
//# sourceMappingURL=runtime.js.map