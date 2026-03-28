import { z } from "zod";

export const transitionAnimationSchema = z.enum(["slide", "fade", "none"]);
export const textAlignSchema = z.enum(["left", "center", "right"]);
export const fontWeightSchema = z.enum(["normal", "medium", "semibold", "bold"]);
export const constraintAnchorSchema = z.enum(["min", "max", "center", "stretch"]);
export const buttonActionSchema = z.enum([
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
export const ruleOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "is_set",
  "is_not_set",
]);

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const optionalHexColorSchema = hexColorSchema.optional();

export const textPropsSchema = z.object({
  content: z.string().min(1).max(500),
  fontSize: z.number().min(8).max(72).optional(),
  fontWeight: fontWeightSchema.optional(),
  color: optionalHexColorSchema,
  textAlign: textAlignSchema.optional(),
  lineHeight: z.number().min(0.8).max(3).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const imagePropsSchema = z.object({
  src: z.string().url(),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  resizeMode: z.enum(["cover", "contain", "stretch", "center"]).optional(),
  alt: z.string().max(200).optional(),
});

export const lottiePropsSchema = z.object({
  src: z.string().url(),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  autoPlay: z.boolean().optional(),
  loop: z.boolean().optional(),
});

export const videoPropsSchema = z.object({
  src: z.string().url(),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  autoPlay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  posterUrl: z.string().url().optional(),
});

export const iconPropsSchema = z.object({
  name: z.string().min(1),
  size: z.number().min(8).max(128).optional(),
  color: optionalHexColorSchema,
});

export const iconLibraryPropsSchema = z.object({
  iconName: z.string().min(1),
  size: z.number().min(8).max(128).optional(),
  color: optionalHexColorSchema,
  width: z.number().min(8).max(512).optional(),
  height: z.number().min(8).max(512).optional(),
  opacity: z.number().min(0).max(1).optional(),
  paddingVertical: z.number().min(0).max(100).optional(),
  paddingHorizontal: z.number().min(0).max(100).optional(),
  marginVertical: z.number().min(0).max(100).optional(),
  marginHorizontal: z.number().min(0).max(100).optional(),
  backgroundColor: optionalHexColorSchema,
});

export const buttonStyleSchema = z.object({
  backgroundColor: optionalHexColorSchema,
  textColor: optionalHexColorSchema,
  borderRadius: z.number().min(0).max(999).optional(),
  borderColor: optionalHexColorSchema,
  borderWidth: z.number().min(0).max(10).optional(),
});

export const buttonPropsSchema = z
  .object({
    label: z.string().min(1).max(50),
    action: buttonActionSchema,
    actionTarget: z.enum(["", "first", "last", "specific"]).optional(),
    actionTargetScreenId: z.string().min(1).optional(),
    url: z.string().url().optional(),
    deepLinkUrl: z.string().min(1).optional(),
    eventName: z.string().max(100).optional(),
    style: buttonStyleSchema.optional(),
  })
  .superRefine((data, ctx) => {
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

export const textInputPropsSchema = z.object({
  placeholder: z.string().max(100).optional(),
  label: z.string().max(100).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  required: z.boolean().optional(),
  keyboardType: z.enum(["default", "email", "numeric", "phone"]).optional(),
  maxLength: z.number().min(1).max(1000).optional(),
});

export const selectOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  iconName: z.string().optional(),
});

export const multiSelectPropsSchema = z.object({
  label: z.string().max(200).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  options: z.array(selectOptionSchema).min(2).max(20),
  minSelections: z.number().min(0).optional(),
  maxSelections: z.number().min(1).optional(),
  required: z.boolean().optional(),
});

export const singleSelectPropsSchema = z.object({
  label: z.string().max(200).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  options: z.array(selectOptionSchema).min(2).max(20),
  required: z.boolean().optional(),
});

export const sliderPropsSchema = z.object({
  label: z.string().max(200).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  min: z.number(),
  max: z.number(),
  step: z.number().min(0.01).optional(),
  defaultValue: z.number().optional(),
  minLabel: z.string().max(30).optional(),
  maxLabel: z.string().max(30).optional(),
});

export const progressBarPropsSchema = z.object({
  color: optionalHexColorSchema,
  backgroundColor: optionalHexColorSchema,
  height: z.number().min(1).max(20).optional(),
});

export const pageIndicatorPropsSchema = z.object({
  activeColor: optionalHexColorSchema,
  inactiveColor: optionalHexColorSchema,
  size: z.number().min(4).max(20).optional(),
});

export const stackPropsSchema = z.object({
  direction: z.enum(["vertical", "horizontal"]).optional(),
  gap: z.number().min(0).max(100).optional(),
  padding: z.number().min(0).max(100).optional(),
  backgroundColor: optionalHexColorSchema,
  borderRadius: z.number().min(0).max(999).optional(),
});

export const footerPropsSchema = z.object({
  text: z.string().min(1).max(200),
  textColor: optionalHexColorSchema,
  fontSize: z.number().min(8).max(48).optional(),
  backgroundColor: optionalHexColorSchema,
  showDivider: z.boolean().optional(),
});

export const tabButtonPropsSchema = z.object({
  tabs: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(50),
    active: z.boolean().optional(),
  })).min(1).max(5),
  activeColor: optionalHexColorSchema,
  inactiveColor: optionalHexColorSchema,
});

export const carouselPropsSchema = z.object({
  variant: z.enum(["image", "card"]).optional(),
  items: z.array(
    z.object({
      id: z.string().min(1),
      imageSrc: z.string().url().optional(),
      title: z.string().max(100).optional(),
      subtitle: z.string().max(200).optional(),
    })
  ).min(1).max(20),
  height: z.number().min(1).max(2000).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  showDots: z.boolean().optional(),
});

export const socialProofPropsSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  totalReviews: z.number().min(0).optional(),
  reviews: z.array(
    z.object({
      id: z.string().min(1),
      author: z.string().min(1).max(100),
      rating: z.number().min(0).max(5),
      text: z.string().max(500).optional(),
      avatar: z.string().url().optional(),
    })
  ).max(20).optional(),
  showStars: z.boolean().optional(),
  compact: z.boolean().optional(),
});

export const featureListPropsSchema = z.object({
  title: z.string().max(100).optional(),
  features: z.array(
    z.object({
      id: z.string().min(1),
      icon: z.string().optional(),
      label: z.string().min(1).max(200),
    })
  ).min(1).max(20),
  iconColor: optionalHexColorSchema,
  textColor: optionalHexColorSchema,
});

export const awardPropsSchema = z.object({
  variant: z.enum(["badge", "laurel", "minimal"]).optional(),
  title: z.string().min(1).max(100),
  subtitle: z.string().max(200).optional(),
  issuer: z.string().max(100).optional(),
  iconSrc: z.string().url().optional(),
  showLaurels: z.boolean().optional(),
  backgroundColor: optionalHexColorSchema,
  textColor: optionalHexColorSchema,
});

export const customComponentPropsSchema = z.object({
  registryKey: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const componentConstraintsSchema = z.object({
  horizontal: constraintAnchorSchema.optional(),
  vertical: constraintAnchorSchema.optional(),
  keepAspectRatio: z.boolean().optional(),
});

export const componentLayoutSchema = z.object({
  position: z.enum(["flow", "absolute"]).optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  width: z.number().finite().positive().optional(),
  height: z.number().finite().positive().optional(),
  rotation: z.number().finite().optional(),
  zIndex: z.number().int().optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  constraints: componentConstraintsSchema.optional(),
});

const componentBaseSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(0),
  layout: componentLayoutSchema.optional(),
});

export const flowComponentSchema = z.discriminatedUnion("type", [
  componentBaseSchema.extend({ type: z.literal("TEXT"), props: textPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("IMAGE"), props: imagePropsSchema }),
  componentBaseSchema.extend({ type: z.literal("LOTTIE"), props: lottiePropsSchema }),
  componentBaseSchema.extend({ type: z.literal("VIDEO"), props: videoPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("ICON"), props: iconPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("ICON_LIBRARY"), props: iconLibraryPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("BUTTON"), props: buttonPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("TEXT_INPUT"), props: textInputPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("MULTI_SELECT"), props: multiSelectPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("SINGLE_SELECT"), props: singleSelectPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("SLIDER"), props: sliderPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("PROGRESS_BAR"), props: progressBarPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("PAGE_INDICATOR"), props: pageIndicatorPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("STACK"), props: stackPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("FOOTER"), props: footerPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("TAB_BUTTON"), props: tabButtonPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("CAROUSEL"), props: carouselPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("SOCIAL_PROOF"), props: socialProofPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("FEATURE_LIST"), props: featureListPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("AWARD"), props: awardPropsSchema }),
  componentBaseSchema.extend({ type: z.literal("CUSTOM_COMPONENT"), props: customComponentPropsSchema }),
]);

export const branchRuleSchema = z.object({
  id: z.string().min(1),
  fieldKey: z.string().min(1).max(50),
  operator: ruleOperatorSchema,
  value: z.union([z.string(), z.array(z.string())]).optional(),
  targetScreenId: z.string().min(1),
});

export const skipConditionSchema = z.object({
  id: z.string().min(1),
  fieldKey: z.string().min(1).max(50),
  operator: ruleOperatorSchema,
  value: z.union([z.string(), z.array(z.string())]).optional(),
});

export const screenStyleSchema = z.object({
  backgroundColor: optionalHexColorSchema,
  backgroundImage: z.string().url().optional(),
  padding: z.number().min(0).max(100).optional(),
  paddingTop: z.number().min(0).max(100).optional(),
  paddingBottom: z.number().min(0).max(100).optional(),
  paddingHorizontal: z.number().min(0).max(100).optional(),
  justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around"]).optional(),
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
});

export const screenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  order: z.number().int().min(0),
  layoutMode: z.enum(["auto", "absolute"]).optional(),
  style: screenStyleSchema.optional(),
  customScreenKey: z.string().min(1).max(100).optional(),
  customPayload: z.record(z.string(), z.unknown()).optional(),
  components: z.array(flowComponentSchema).max(20),
  branchRules: z.array(branchRuleSchema).max(20).optional(),
  skipWhen: z.array(skipConditionSchema).max(20).optional(),
});

export const flowSettingsSchema = z.object({
  dismissible: z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  progressBarColor: optionalHexColorSchema,
  transitionAnimation: transitionAnimationSchema.optional(),
  showBackButton: z.boolean().optional(),
  showSkipButton: z.boolean().optional(),
  skipButtonLabel: z.string().max(30).optional(),
});

export const flowConfigSchema = z.object({
  screens: z.array(screenSchema).min(1).max(20),
  settings: flowSettingsSchema.optional(),
});

export const sdkFlowResponseSchema = z.object({
  flow: z.object({
    slug: z.string().min(1),
    version: z.number().int().min(1),
    config: flowConfigSchema,
  }),
});

export const sdkErrorCodeSchema = z.enum([
  "FLOW_NOT_FOUND",
  "FLOW_NOT_PUBLISHED",
  "INVALID_API_KEY",
  "PROJECT_NOT_FOUND",
]);

export const sdkErrorResponseSchema = z.object({
  error: z.string().min(1),
  code: sdkErrorCodeSchema,
});
