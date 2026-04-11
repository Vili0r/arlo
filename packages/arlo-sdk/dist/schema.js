"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdkErrorResponseSchema = exports.sdkErrorCodeSchema = exports.sdkFlowResponseSchema = exports.flowConfigSchema = exports.flowSettingsSchema = exports.screenSchema = exports.screenStyleSchema = exports.skipConditionSchema = exports.branchRuleSchema = exports.flowComponentSchema = exports.componentLayoutSchema = exports.componentConstraintsSchema = exports.customComponentPropsSchema = exports.awardPropsSchema = exports.featureListPropsSchema = exports.socialProofPropsSchema = exports.carouselPropsSchema = exports.tabButtonPropsSchema = exports.footerPropsSchema = exports.stackPropsSchema = exports.pageIndicatorPropsSchema = exports.progressBarPropsSchema = exports.sliderPropsSchema = exports.singleSelectPropsSchema = exports.multiSelectPropsSchema = exports.selectOptionSchema = exports.textInputPropsSchema = exports.buttonPropsSchema = exports.buttonStyleSchema = exports.iconLibraryPropsSchema = exports.iconPropsSchema = exports.videoPropsSchema = exports.lottiePropsSchema = exports.imagePropsSchema = exports.textPropsSchema = exports.ruleOperatorSchema = exports.buttonActionSchema = exports.constraintAnchorSchema = exports.fontWeightSchema = exports.textAlignSchema = exports.transitionAnimationSchema = void 0;
const zod_1 = require("zod");
exports.transitionAnimationSchema = zod_1.z.enum(["slide", "fade", "none"]);
exports.textAlignSchema = zod_1.z.enum(["left", "center", "right"]);
exports.fontWeightSchema = zod_1.z.enum(["normal", "medium", "semibold", "bold"]);
exports.constraintAnchorSchema = zod_1.z.enum(["min", "max", "center", "stretch"]);
exports.buttonActionSchema = zod_1.z.enum([
    "NEXT_SCREEN",
    "PREV_SCREEN",
    "SKIP_FLOW",
    "OPEN_URL",
    "DEEP_LINK",
    "CUSTOM_EVENT",
    "DISMISS",
    "CLOSE_FLOW",
    "REQUEST_NOTIFICATIONS",
    "REQUEST_TRACKING",
    "RESTORE_PURCHASES",
]);
exports.ruleOperatorSchema = zod_1.z.enum([
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "is_set",
    "is_not_set",
]);
const hexColorSchema = zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const optionalHexColorSchema = hexColorSchema.optional();
exports.textPropsSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(500),
    fontSize: zod_1.z.number().min(8).max(72).optional(),
    fontWeight: exports.fontWeightSchema.optional(),
    color: optionalHexColorSchema,
    textAlign: exports.textAlignSchema.optional(),
    lineHeight: zod_1.z.number().min(0.8).max(3).optional(),
    opacity: zod_1.z.number().min(0).max(1).optional(),
}).passthrough();
exports.imagePropsSchema = zod_1.z.object({
    src: zod_1.z.string().url(),
    width: zod_1.z.number().min(1).max(2000).optional(),
    height: zod_1.z.number().min(1).max(2000).optional(),
    borderRadius: zod_1.z.number().min(0).max(999).optional(),
    resizeMode: zod_1.z.enum(["cover", "contain", "stretch", "center"]).optional(),
    alt: zod_1.z.string().max(200).optional(),
}).passthrough();
exports.lottiePropsSchema = zod_1.z.object({
    src: zod_1.z.string().url(),
    width: zod_1.z.number().min(1).max(2000).optional(),
    height: zod_1.z.number().min(1).max(2000).optional(),
    autoPlay: zod_1.z.boolean().optional(),
    loop: zod_1.z.boolean().optional(),
}).passthrough();
exports.videoPropsSchema = zod_1.z.object({
    src: zod_1.z.string().url(),
    width: zod_1.z.number().min(1).max(2000).optional(),
    height: zod_1.z.number().min(1).max(2000).optional(),
    autoPlay: zod_1.z.boolean().optional(),
    loop: zod_1.z.boolean().optional(),
    muted: zod_1.z.boolean().optional(),
    posterUrl: zod_1.z.string().url().optional(),
}).passthrough();
exports.iconPropsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    size: zod_1.z.number().min(8).max(128).optional(),
    color: optionalHexColorSchema,
}).passthrough();
exports.iconLibraryPropsSchema = zod_1.z.object({
    iconName: zod_1.z.string().min(1),
    size: zod_1.z.number().min(8).max(128).optional(),
    color: optionalHexColorSchema,
    width: zod_1.z.number().min(8).max(512).optional(),
    height: zod_1.z.number().min(8).max(512).optional(),
    opacity: zod_1.z.number().min(0).max(1).optional(),
    paddingVertical: zod_1.z.number().min(0).max(100).optional(),
    paddingHorizontal: zod_1.z.number().min(0).max(100).optional(),
    marginVertical: zod_1.z.number().min(0).max(100).optional(),
    marginHorizontal: zod_1.z.number().min(0).max(100).optional(),
    backgroundColor: optionalHexColorSchema,
}).passthrough();
exports.buttonStyleSchema = zod_1.z.object({
    backgroundColor: optionalHexColorSchema,
    textColor: optionalHexColorSchema,
    borderRadius: zod_1.z.number().min(0).max(999).optional(),
    borderColor: optionalHexColorSchema,
    borderWidth: zod_1.z.number().min(0).max(10).optional(),
}).passthrough();
exports.buttonPropsSchema = zod_1.z
    .object({
    label: zod_1.z.string().max(50),
    action: exports.buttonActionSchema,
    actionTarget: zod_1.z.enum(["", "previous", "first", "last", "specific"]).optional(),
    actionTargetScreenId: zod_1.z.string().min(1).optional().or(zod_1.z.literal("")),
    url: zod_1.z.string().url().optional(),
    deepLinkUrl: zod_1.z.string().min(1).optional(),
    eventName: zod_1.z.string().max(100).optional(),
    showIcon: zod_1.z.boolean().optional(),
    iconName: zod_1.z.string().min(1).optional(),
    iconPosition: zod_1.z.enum(["left", "right", "only"]).optional(),
    iconSize: zod_1.z.number().min(8).max(128).optional(),
    iconColor: optionalHexColorSchema,
    iconSpacing: zod_1.z.number().min(0).max(100).optional(),
    style: exports.buttonStyleSchema.optional(),
})
    .passthrough()
    .superRefine((data, ctx) => {
    if (data.label.trim().length === 0 &&
        !(data.showIcon === true && Boolean(data.iconName) && data.iconPosition === "only")) {
        ctx.addIssue({
            code: "custom",
            path: ["label"],
            message: "Button label is required unless this is an icon-only button",
        });
    }
    if (data.action === "OPEN_URL" && !data.url) {
        ctx.addIssue({
            code: "custom",
            path: ["url"],
            message: "URL is required when action is OPEN_URL",
        });
    }
    if (data.action === "DEEP_LINK" && !data.deepLinkUrl) {
        ctx.addIssue({
            code: "custom",
            path: ["deepLinkUrl"],
            message: "Deep link URL is required when action is DEEP_LINK",
        });
    }
    if (data.action === "CUSTOM_EVENT" && !data.eventName) {
        ctx.addIssue({
            code: "custom",
            path: ["eventName"],
            message: "Event name is required when action is CUSTOM_EVENT",
        });
    }
    if (data.actionTarget === "specific" && !data.actionTargetScreenId) {
        ctx.addIssue({
            code: "custom",
            path: ["actionTargetScreenId"],
            message: "Specific action targets require a screen id",
        });
    }
});
exports.textInputPropsSchema = zod_1.z.object({
    placeholder: zod_1.z.string().max(100).optional(),
    label: zod_1.z.string().max(100).optional(),
    fieldKey: zod_1.z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
    required: zod_1.z.boolean().optional(),
    keyboardType: zod_1.z.enum(["default", "email", "numeric", "phone"]).optional(),
    maxLength: zod_1.z.number().min(1).max(1000).optional(),
}).passthrough();
exports.selectOptionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1).max(100),
    iconName: zod_1.z.string().optional(),
});
exports.multiSelectPropsSchema = zod_1.z.object({
    label: zod_1.z.string().max(200).optional(),
    fieldKey: zod_1.z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
    options: zod_1.z.array(exports.selectOptionSchema).min(2).max(20),
    minSelections: zod_1.z.number().min(0).optional(),
    maxSelections: zod_1.z.number().min(1).optional(),
    required: zod_1.z.boolean().optional(),
}).passthrough();
exports.singleSelectPropsSchema = zod_1.z.object({
    label: zod_1.z.string().max(200).optional(),
    fieldKey: zod_1.z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
    options: zod_1.z.array(exports.selectOptionSchema).min(2).max(20),
    required: zod_1.z.boolean().optional(),
}).passthrough();
exports.sliderPropsSchema = zod_1.z.object({
    label: zod_1.z.string().max(200).optional(),
    fieldKey: zod_1.z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
    min: zod_1.z.number(),
    max: zod_1.z.number(),
    step: zod_1.z.number().min(0.01).optional(),
    defaultValue: zod_1.z.number().optional(),
    minLabel: zod_1.z.string().max(30).optional(),
    maxLabel: zod_1.z.string().max(30).optional(),
}).passthrough();
exports.progressBarPropsSchema = zod_1.z.object({
    color: optionalHexColorSchema,
    backgroundColor: optionalHexColorSchema,
    height: zod_1.z.number().min(1).max(20).optional(),
}).passthrough();
exports.pageIndicatorPropsSchema = zod_1.z.object({
    activeColor: optionalHexColorSchema,
    inactiveColor: optionalHexColorSchema,
    size: zod_1.z.number().min(4).max(20).optional(),
}).passthrough();
exports.stackPropsSchema = zod_1.z.object({
    direction: zod_1.z.enum(["vertical", "horizontal"]).optional(),
    gap: zod_1.z.number().min(0).max(100).optional(),
    padding: zod_1.z.number().min(0).max(100).optional(),
    backgroundColor: optionalHexColorSchema,
    borderRadius: zod_1.z.number().min(0).max(999).optional(),
}).passthrough();
exports.footerPropsSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(200),
    textColor: optionalHexColorSchema,
    fontSize: zod_1.z.number().min(8).max(48).optional(),
    backgroundColor: optionalHexColorSchema,
    showDivider: zod_1.z.boolean().optional(),
}).passthrough();
exports.tabButtonPropsSchema = zod_1.z.object({
    tabs: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        label: zod_1.z.string().min(1).max(50),
        active: zod_1.z.boolean().optional(),
    })).min(1).max(5),
    activeColor: optionalHexColorSchema,
    inactiveColor: optionalHexColorSchema,
}).passthrough();
exports.carouselPropsSchema = zod_1.z.object({
    variant: zod_1.z.enum(["image", "card"]).optional(),
    items: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        imageSrc: zod_1.z.string().url().optional(),
        title: zod_1.z.string().max(100).optional(),
        subtitle: zod_1.z.string().max(200).optional(),
    })).min(1).max(20),
    height: zod_1.z.number().min(1).max(2000).optional(),
    borderRadius: zod_1.z.number().min(0).max(999).optional(),
    showDots: zod_1.z.boolean().optional(),
}).passthrough();
exports.socialProofPropsSchema = zod_1.z.object({
    rating: zod_1.z.number().min(0).max(5).optional(),
    totalReviews: zod_1.z.number().min(0).optional(),
    reviews: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        author: zod_1.z.string().min(1).max(100),
        rating: zod_1.z.number().min(0).max(5),
        text: zod_1.z.string().max(500).optional(),
        avatar: zod_1.z.string().url().optional(),
    })).max(20).optional(),
    showStars: zod_1.z.boolean().optional(),
    compact: zod_1.z.boolean().optional(),
}).passthrough();
exports.featureListPropsSchema = zod_1.z.object({
    title: zod_1.z.string().max(100).optional(),
    features: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().min(1),
        icon: zod_1.z.string().optional(),
        label: zod_1.z.string().min(1).max(200),
    })).min(1).max(20),
    iconColor: optionalHexColorSchema,
    textColor: optionalHexColorSchema,
}).passthrough();
exports.awardPropsSchema = zod_1.z.object({
    variant: zod_1.z.enum(["badge", "laurel", "minimal"]).optional(),
    title: zod_1.z.string().min(1).max(100),
    subtitle: zod_1.z.string().max(200).optional(),
    issuer: zod_1.z.string().max(100).optional(),
    iconSrc: zod_1.z.string().url().optional(),
    showLaurels: zod_1.z.boolean().optional(),
    backgroundColor: optionalHexColorSchema,
    textColor: optionalHexColorSchema,
}).passthrough();
exports.customComponentPropsSchema = zod_1.z.object({
    registryKey: zod_1.z.string().min(1).max(100),
    payload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
}).passthrough();
exports.componentConstraintsSchema = zod_1.z.object({
    horizontal: exports.constraintAnchorSchema.optional(),
    vertical: exports.constraintAnchorSchema.optional(),
    keepAspectRatio: zod_1.z.boolean().optional(),
});
exports.componentLayoutSchema = zod_1.z.object({
    position: zod_1.z.enum(["flow", "absolute"]).optional(),
    x: zod_1.z.number().finite().optional(),
    y: zod_1.z.number().finite().optional(),
    width: zod_1.z.number().finite().positive().optional(),
    height: zod_1.z.number().finite().positive().optional(),
    rotation: zod_1.z.number().finite().optional(),
    zIndex: zod_1.z.number().int().optional(),
    visible: zod_1.z.boolean().optional(),
    locked: zod_1.z.boolean().optional(),
    constraints: exports.componentConstraintsSchema.optional(),
}).passthrough();
const componentBaseSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    order: zod_1.z.number().int().min(0),
    layout: exports.componentLayoutSchema.optional(),
});
exports.flowComponentSchema = zod_1.z.discriminatedUnion("type", [
    componentBaseSchema.extend({ type: zod_1.z.literal("TEXT"), props: exports.textPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("IMAGE"), props: exports.imagePropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("LOTTIE"), props: exports.lottiePropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("VIDEO"), props: exports.videoPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("ICON"), props: exports.iconPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("ICON_LIBRARY"), props: exports.iconLibraryPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("BUTTON"), props: exports.buttonPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("TEXT_INPUT"), props: exports.textInputPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("MULTI_SELECT"), props: exports.multiSelectPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("SINGLE_SELECT"), props: exports.singleSelectPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("SLIDER"), props: exports.sliderPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("PROGRESS_BAR"), props: exports.progressBarPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("PAGE_INDICATOR"), props: exports.pageIndicatorPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("STACK"), props: exports.stackPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("FOOTER"), props: exports.footerPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("TAB_BUTTON"), props: exports.tabButtonPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("CAROUSEL"), props: exports.carouselPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("SOCIAL_PROOF"), props: exports.socialProofPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("FEATURE_LIST"), props: exports.featureListPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("AWARD"), props: exports.awardPropsSchema }),
    componentBaseSchema.extend({ type: zod_1.z.literal("CUSTOM_COMPONENT"), props: exports.customComponentPropsSchema }),
]);
exports.branchRuleSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    fieldKey: zod_1.z.string().min(1).max(50),
    operator: exports.ruleOperatorSchema,
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    targetScreenId: zod_1.z.string().min(1),
});
exports.skipConditionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    fieldKey: zod_1.z.string().min(1).max(50),
    operator: exports.ruleOperatorSchema,
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
});
exports.screenStyleSchema = zod_1.z.object({
    backgroundColor: optionalHexColorSchema,
    backgroundImage: zod_1.z.string().url().optional(),
    padding: zod_1.z.number().min(0).max(100).optional(),
    paddingTop: zod_1.z.number().min(0).max(100).optional(),
    paddingBottom: zod_1.z.number().min(0).max(100).optional(),
    paddingHorizontal: zod_1.z.number().min(0).max(100).optional(),
    justifyContent: zod_1.z.enum(["flex-start", "center", "flex-end", "space-between", "space-around"]).optional(),
    alignItems: zod_1.z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
}).passthrough();
exports.screenSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1).max(50),
    order: zod_1.z.number().int().min(0),
    layoutMode: zod_1.z.enum(["auto", "absolute"]).optional(),
    style: exports.screenStyleSchema.optional(),
    customScreenKey: zod_1.z.string().min(1).max(100).optional(),
    customPayload: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    components: zod_1.z.array(exports.flowComponentSchema).max(20),
    branchRules: zod_1.z.array(exports.branchRuleSchema).max(20).optional(),
    skipWhen: zod_1.z.array(exports.skipConditionSchema).max(20).optional(),
}).passthrough();
exports.flowSettingsSchema = zod_1.z.object({
    dismissible: zod_1.z.boolean().optional(),
    showProgressBar: zod_1.z.boolean().optional(),
    progressBarColor: optionalHexColorSchema,
    transitionAnimation: exports.transitionAnimationSchema.optional(),
    showBackButton: zod_1.z.boolean().optional(),
    showSkipButton: zod_1.z.boolean().optional(),
    skipButtonLabel: zod_1.z.string().max(30).optional(),
}).passthrough();
exports.flowConfigSchema = zod_1.z.object({
    screens: zod_1.z.array(exports.screenSchema).min(1).max(20),
    settings: exports.flowSettingsSchema.optional(),
}).passthrough();
exports.sdkFlowResponseSchema = zod_1.z.object({
    flow: zod_1.z.object({
        slug: zod_1.z.string().min(1),
        version: zod_1.z.number().int().min(1),
        config: exports.flowConfigSchema,
    }),
});
exports.sdkErrorCodeSchema = zod_1.z.enum([
    "FLOW_NOT_FOUND",
    "FLOW_NOT_PUBLISHED",
    "INVALID_API_KEY",
    "PROJECT_NOT_FOUND",
]);
exports.sdkErrorResponseSchema = zod_1.z.object({
    error: zod_1.z.string().min(1),
    code: exports.sdkErrorCodeSchema,
});
//# sourceMappingURL=schema.js.map