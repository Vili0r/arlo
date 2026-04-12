import { z } from 'zod';

// ========== Enums ==========

export const platformEnum = z.enum([
  "REACT_NATIVE",
  "EXPO",
]);

export const environmentEnum = z.enum([
  "DEVELOPMENT",
  "PRODUCTION",
]);

export const flowStatusEnum = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

// ========== Component Types ==========

export const componentTypeEnum = z.enum([
  // Content
  "TEXT",
  "IMAGE",
  "LOTTIE",
  "VIDEO",
  "ICON",
  "ICON_LIBRARY",
  // Interactive
  "BUTTON",
  "TEXT_INPUT",
  "MULTI_SELECT",
  "SINGLE_SELECT",
  "SLIDER",
  // Navigation
  "PROGRESS_BAR",
  "PAGE_INDICATOR",
  // Layout
  "STACK",
  "FOOTER",
  "TAB_BUTTON",
  // Rich
  "CAROUSEL",
  "SOCIAL_PROOF",
  "FEATURE_LIST",
  "AWARD",
  "CUSTOM_COMPONENT",
]);

export const buttonActionEnum = z.enum([
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

export const transitionAnimationEnum = z.enum([
  "slide",
  "fade",
  "none",
]);

export const textAlignEnum = z.enum([
  "left",
  "center",
  "right",
]);

export const fontWeightEnum = z.enum([
  "normal",
  "medium",
  "semibold",
  "bold",
]);

// ========== Component Props ==========

export const textPropsSchema = z.object({
  content: z.string().min(1, "Text content is required").max(500, "Text must be under 500 characters"),
  fontSize: z.number().min(8).max(72).optional(),
  fontWeight: fontWeightEnum.optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  textAlign: textAlignEnum.optional(),
  lineHeight: z.number().min(0.8).max(3).optional(),
  opacity: z.number().min(0).max(1).optional(),
}).passthrough();

export const imagePropsSchema = z.object({
  src: z.string().url("Must be a valid URL"),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  resizeMode: z.enum(["cover", "contain", "stretch", "center"]).optional(),
  alt: z.string().max(200).optional(),
}).passthrough();

export const lottiePropsSchema = z.object({
  src: z.string().url("Must be a valid URL"),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  autoPlay: z.boolean().optional(),
  loop: z.boolean().optional(),
}).passthrough();

export const videoPropsSchema = z.object({
  src: z.string().url("Must be a valid URL"),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  autoPlay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  posterUrl: z.string().url().optional(),
}).passthrough();

export const iconPropsSchema = z.object({
  name: z.string().min(1, "Icon name is required"),
  size: z.number().min(8).max(128).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
}).passthrough();

export const iconLibraryPropsSchema = z.object({
  iconName: z.string().min(1, "Icon name is required"),
  size: z.number().min(8).max(128).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  width: z.number().min(8).max(512).optional(),
  height: z.number().min(8).max(512).optional(),
  opacity: z.number().min(0).max(1).optional(),
  paddingVertical: z.number().min(0).max(100).optional(),
  paddingHorizontal: z.number().min(0).max(100).optional(),
  marginVertical: z.number().min(0).max(100).optional(),
  marginHorizontal: z.number().min(0).max(100).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).passthrough();

export const buttonStyleSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderWidth: z.number().min(0).max(10).optional(),
}).passthrough();

export const buttonPropsSchema = z.object({
  label: z.string().max(50, "Button label must be under 50 characters"),
  action: buttonActionEnum,
  actionTarget: z.enum(["", "previous", "first", "last", "specific"]).optional(),
  actionTargetScreenId: z.string().min(1).optional().or(z.literal("")),
  url: z.string().url("Must be a valid URL").optional(), // required when action is OPEN_URL
  deepLinkUrl: z.string().min(1).optional(),
  eventName: z.string().max(100).optional(), // required when action is CUSTOM_EVENT
  showIcon: z.boolean().optional(),
  iconName: z.string().min(1, "Icon name is required").optional(),
  iconPosition: z.enum(["left", "right", "only"]).optional(),
  iconSize: z.number().min(8).max(128).optional(),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  iconSpacing: z.number().min(0).max(100).optional(),
  style: buttonStyleSchema.optional(),
}).passthrough().superRefine((data, ctx) => {
  if (
    data.label.trim().length === 0 &&
    !(data.showIcon === true && Boolean(data.iconName) && data.iconPosition === "only")
  ) {
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
      message: "A target screen ID is required when action target is specific",
    });
  }
});

export const textInputPropsSchema = z.object({
  placeholder: z.string().max(100).optional(),
  label: z.string().max(100).optional(),
  fieldKey: z.string().min(1, "Field key is required").max(50).regex(/^[a-zA-Z0-9_]+$/, "Field key must be alphanumeric with underscores"),
  required: z.boolean().optional(),
  keyboardType: z.enum(["default", "email", "numeric", "phone"]).optional(),
  maxLength: z.number().min(1).max(1000).optional(),
}).passthrough();

export const selectOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  iconName: z.string().optional(),
});

export const multiSelectPropsSchema = z.object({
  label: z.string().max(200).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  options: z.array(selectOptionSchema).min(2, "At least 2 options required").max(20),
  minSelections: z.number().min(0).optional(),
  maxSelections: z.number().min(1).optional(),
  required: z.boolean().optional(),
}).passthrough();

export const singleSelectPropsSchema = z.object({
  label: z.string().max(200).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  options: z.array(selectOptionSchema).min(2, "At least 2 options required").max(20),
  required: z.boolean().optional(),
}).passthrough();

export const sliderPropsSchema = z.object({
  label: z.string().max(200).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  min: z.number(),
  max: z.number(),
  step: z.number().min(0.01).optional(),
  defaultValue: z.number().optional(),
  minLabel: z.string().max(30).optional(),
  maxLabel: z.string().max(30).optional(),
}).passthrough();

export const progressBarPropsSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  height: z.number().min(1).max(20).optional(),
}).passthrough();

export const pageIndicatorPropsSchema = z.object({
  activeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  inactiveColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  size: z.number().min(4).max(20).optional(),
}).passthrough();

export const stackPropsSchema = z.object({
  direction: z.enum(["vertical", "horizontal"]).optional(),
  gap: z.number().min(0).max(100).optional(),
  padding: z.number().min(0).max(100).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
}).passthrough();

export const footerPropsSchema = z.object({
  text: z.string().min(1).max(200),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontSize: z.number().min(8).max(48).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  showDivider: z.boolean().optional(),
}).passthrough();

export const tabButtonPropsSchema = z.object({
  tabs: z.array(z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(50),
    active: z.boolean().optional(),
  })).min(1).max(5),
  activeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  inactiveColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).passthrough();

export const carouselPropsSchema = z.object({
  variant: z.enum(["image", "card"]).optional(),
  items: z.array(z.object({
    id: z.string().min(1),
    imageSrc: z.string().url().optional(),
    title: z.string().max(100).optional(),
    subtitle: z.string().max(200).optional(),
  })).min(1).max(20),
  height: z.number().min(1).max(2000).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  showDots: z.boolean().optional(),
}).passthrough();

export const socialProofReviewSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1).max(100),
  rating: z.number().min(0).max(5),
  text: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const socialProofPropsSchema = z.object({
  rating: z.number().min(0).max(5).optional(),
  totalReviews: z.number().min(0).optional(),
  reviews: z.array(socialProofReviewSchema).max(20).optional(),
  showStars: z.boolean().optional(),
  compact: z.boolean().optional(),
}).passthrough();

export const featureItemSchema = z.object({
  id: z.string().min(1),
  icon: z.string().optional(),
  label: z.string().min(1).max(200),
});

export const featureListPropsSchema = z.object({
  title: z.string().max(100).optional(),
  features: z.array(featureItemSchema).min(1).max(20),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).passthrough();

export const awardPropsSchema = z.object({
  variant: z.enum(["badge", "laurel", "minimal"]).optional(),
  title: z.string().min(1).max(100),
  subtitle: z.string().max(200).optional(),
  issuer: z.string().max(100).optional(),
  iconSrc: z.string().url().optional(),
  showLaurels: z.boolean().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).passthrough();

export const customComponentPropsSchema = z.object({
  registryKey: z.string().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

// ========== Component Schema ==========
// Uses a discriminated union so each component type
// validates against its own specific props.

export const componentSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("TEXT"),
    order: z.number().int().min(0),
    props: textPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("IMAGE"),
    order: z.number().int().min(0),
    props: imagePropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("LOTTIE"),
    order: z.number().int().min(0),
    props: lottiePropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("VIDEO"),
    order: z.number().int().min(0),
    props: videoPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("ICON"),
    order: z.number().int().min(0),
    props: iconPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("ICON_LIBRARY"),
    order: z.number().int().min(0),
    props: iconLibraryPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("BUTTON"),
    order: z.number().int().min(0),
    props: buttonPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("TEXT_INPUT"),
    order: z.number().int().min(0),
    props: textInputPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("MULTI_SELECT"),
    order: z.number().int().min(0),
    props: multiSelectPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("SINGLE_SELECT"),
    order: z.number().int().min(0),
    props: singleSelectPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("SLIDER"),
    order: z.number().int().min(0),
    props: sliderPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("PROGRESS_BAR"),
    order: z.number().int().min(0),
    props: progressBarPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("PAGE_INDICATOR"),
    order: z.number().int().min(0),
    props: pageIndicatorPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("STACK"),
    order: z.number().int().min(0),
    props: stackPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("FOOTER"),
    order: z.number().int().min(0),
    props: footerPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("TAB_BUTTON"),
    order: z.number().int().min(0),
    props: tabButtonPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("CAROUSEL"),
    order: z.number().int().min(0),
    props: carouselPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("SOCIAL_PROOF"),
    order: z.number().int().min(0),
    props: socialProofPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("FEATURE_LIST"),
    order: z.number().int().min(0),
    props: featureListPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("AWARD"),
    order: z.number().int().min(0),
    props: awardPropsSchema,
  }).passthrough(),
  z.object({
    id: z.string().min(1),
    type: z.literal("CUSTOM_COMPONENT"),
    order: z.number().int().min(0),
    props: customComponentPropsSchema,
  }).passthrough(),
]);

export const ruleOperatorEnum = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "is_set",
  "is_not_set",
]);

export const branchRuleSchema = z.object({
  id: z.string().min(1),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  operator: ruleOperatorEnum,
  value: z.union([z.string(), z.array(z.string())]).optional(),
  targetScreenId: z.string().min(1),
});

export const skipConditionSchema = z.object({
  id: z.string().min(1),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  operator: ruleOperatorEnum,
  value: z.union([z.string(), z.array(z.string())]).optional(),
});

// ========== Screen Schema ==========

export const screenStyleSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundImage: z.string().url().optional(),
  padding: z.number().min(0).max(100).optional(),
  paddingTop: z.number().min(0).max(100).optional(),
  paddingBottom: z.number().min(0).max(100).optional(),
  paddingHorizontal: z.number().min(0).max(100).optional(),
  justifyContent: z.enum(["flex-start", "center", "flex-end", "space-between", "space-around"]).optional(),
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch"]).optional(),
}).passthrough();

export const screenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Screen name is required").max(50),
  order: z.number().int().min(0),
  style: screenStyleSchema.optional(),
  customScreenKey: z.string().min(1).max(100).optional(),
  customPayload: z.record(z.string(), z.unknown()).optional(),
  components: z.array(componentSchema).max(20, "A screen can have at most 20 components"),
  branchRules: z.array(branchRuleSchema).max(20).optional(),
  skipWhen: z.array(skipConditionSchema).max(20).optional(),
}).passthrough();

// ========== Flow Config ==========
// This is the JSON blob stored in FlowVersion.config

export const flowSettingsSchema = z.object({
  dismissible: z.boolean().optional(),
  showProgressBar: z.boolean().optional(),
  progressBarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  transitionAnimation: transitionAnimationEnum.optional(),
  showBackButton: z.boolean().optional(),
  showSkipButton: z.boolean().optional(),
  skipButtonLabel: z.string().max(30).optional(),
}).passthrough();

export const flowConfigSchema = z.object({
  screens: z.array(screenSchema)
    .min(1, "Flow must have at least one screen")
    .max(20, "Flow can have at most 20 screens"),
  settings: flowSettingsSchema.optional(),
}).passthrough();

export type FlowConfig = z.infer<typeof flowConfigSchema>;

// ========== Project Schemas ==========

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, "Project name is required")
    .max(50, "Project name must be less than 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Project name can only contain letters, numbers, spaces, hyphens, and underscores"),
  platform: platformEnum,
  iconUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ========== API Key Schemas ==========

export const createApiKeySchema = z.object({
  name: z.string()
    .min(1, "Key name is required")
    .max(50, "Key name must be under 50 characters"),
  environment: environmentEnum,
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

// ========== Flow Schemas ==========

export const createFlowSchema = z.object({
  name: z.string()
    .min(1, "Flow name is required")
    .max(50, "Flow name must be under 50 characters"),
  slug: z.string()
    .min(1, "Flow slug is required")
    .max(50, "Flow slug must be under 50 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens (e.g. welcome-flow)"),
});

export const updateFlowSchema = z.object({
  name: z.string()
    .min(1, "Flow name is required")
    .max(50, "Flow name must be under 50 characters")
    .optional(),
  slug: z.string()
    .min(1, "Flow slug is required")
    .max(50, "Flow slug must be under 50 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  status: flowStatusEnum.optional(),
});

export type CreateFlowInput = z.infer<typeof createFlowSchema>;
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>;

// ========== Entry Point Schemas ==========

export const entryPointKeySchema = z.string()
  .min(1, "Entry point key is required")
  .max(80, "Entry point key must be under 80 characters")
  .regex(/^[a-z0-9_]+$/, "Entry point keys must use lowercase letters, numbers, and underscores");

export const createEntryPointSchema = z.object({
  key: entryPointKeySchema,
  name: z.string().max(80, "Entry point name must be under 80 characters").optional(),
  flowId: z.string().min(1, "A control flow is required"),
  environment: environmentEnum,
  variantFlowId: z.string().min(1).optional(),
  variantPercentage: z.number().int().min(1).max(99).optional(),
}).superRefine((data, ctx) => {
  const hasVariantFlow = Boolean(data.variantFlowId);
  const hasVariantPercentage = typeof data.variantPercentage === "number";

  if (hasVariantFlow !== hasVariantPercentage) {
    ctx.addIssue({
      code: "custom",
      path: hasVariantFlow ? ["variantPercentage"] : ["variantFlowId"],
      message: "A/B tests need both a variant flow and a variant percentage",
    });
  }

  if (data.variantFlowId && data.variantFlowId === data.flowId) {
    ctx.addIssue({
      code: "custom",
      path: ["variantFlowId"],
      message: "Control and variant flows must be different",
    });
  }
});

export type CreateEntryPointInput = z.infer<typeof createEntryPointSchema>;

// ========== Flow Version Schemas ==========

export const createFlowVersionSchema = z.object({
  config: flowConfigSchema,
  changelog: z.string().max(500, "Changelog must be under 500 characters").optional(),
});

export const publishFlowVersionSchema = z.object({
  versionId: z.string().min(1, "Version ID is required"),
});

export type CreateFlowVersionInput = z.infer<typeof createFlowVersionSchema>;
export type PublishFlowVersionInput = z.infer<typeof publishFlowVersionSchema>;
