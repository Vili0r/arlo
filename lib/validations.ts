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
]);

export const buttonActionEnum = z.enum([
  "NEXT_SCREEN",
  "PREV_SCREEN",
  "SKIP_FLOW",
  "OPEN_URL",
  "CUSTOM_EVENT",
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
});

export const imagePropsSchema = z.object({
  src: z.string().url("Must be a valid URL"),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  resizeMode: z.enum(["cover", "contain", "stretch", "center"]).optional(),
  alt: z.string().max(200).optional(),
});

export const lottiePropsSchema = z.object({
  src: z.string().url("Must be a valid URL"),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  autoPlay: z.boolean().optional(),
  loop: z.boolean().optional(),
});

export const videoPropsSchema = z.object({
  src: z.string().url("Must be a valid URL"),
  width: z.number().min(1).max(2000).optional(),
  height: z.number().min(1).max(2000).optional(),
  autoPlay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  posterUrl: z.string().url().optional(),
});

export const iconPropsSchema = z.object({
  name: z.string().min(1, "Icon name is required"),
  size: z.number().min(8).max(128).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
});

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
});

export const buttonStyleSchema = z.object({
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  borderWidth: z.number().min(0).max(10).optional(),
});

export const buttonPropsSchema = z.object({
  label: z.string().min(1, "Button label is required").max(50, "Button label must be under 50 characters"),
  action: buttonActionEnum,
  url: z.string().url("Must be a valid URL").optional(), // required when action is OPEN_URL
  eventName: z.string().max(100).optional(), // required when action is CUSTOM_EVENT
  style: buttonStyleSchema.optional(),
}).refine(
  (data) => data.action !== "OPEN_URL" || (data.url && data.url.length > 0),
  { message: "URL is required when action is OPEN_URL", path: ["url"] }
).refine(
  (data) => data.action !== "CUSTOM_EVENT" || (data.eventName && data.eventName.length > 0),
  { message: "Event name is required when action is CUSTOM_EVENT", path: ["eventName"] }
);

export const textInputPropsSchema = z.object({
  placeholder: z.string().max(100).optional(),
  label: z.string().max(100).optional(),
  fieldKey: z.string().min(1, "Field key is required").max(50).regex(/^[a-zA-Z0-9_]+$/, "Field key must be alphanumeric with underscores"),
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
  options: z.array(selectOptionSchema).min(2, "At least 2 options required").max(20),
  minSelections: z.number().min(0).optional(),
  maxSelections: z.number().min(1).optional(),
  required: z.boolean().optional(),
});

export const singleSelectPropsSchema = z.object({
  label: z.string().max(200).optional(),
  fieldKey: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/),
  options: z.array(selectOptionSchema).min(2, "At least 2 options required").max(20),
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
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  height: z.number().min(1).max(20).optional(),
});

export const pageIndicatorPropsSchema = z.object({
  activeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  inactiveColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  size: z.number().min(4).max(20).optional(),
});

// ========== Component Schema ==========
// Uses a discriminated union so each component type
// validates against its own specific props.

export const componentSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("TEXT"),
    order: z.number().int().min(0),
    props: textPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("IMAGE"),
    order: z.number().int().min(0),
    props: imagePropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("LOTTIE"),
    order: z.number().int().min(0),
    props: lottiePropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("VIDEO"),
    order: z.number().int().min(0),
    props: videoPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("ICON"),
    order: z.number().int().min(0),
    props: iconPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("ICON"),
    order: z.number().int().min(0),
    props: iconPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("ICON_LIBRARY"),
    order: z.number().int().min(0),
    props: iconLibraryPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("BUTTON"),
    order: z.number().int().min(0),
    props: buttonPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("TEXT_INPUT"),
    order: z.number().int().min(0),
    props: textInputPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("MULTI_SELECT"),
    order: z.number().int().min(0),
    props: multiSelectPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("SINGLE_SELECT"),
    order: z.number().int().min(0),
    props: singleSelectPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("SLIDER"),
    order: z.number().int().min(0),
    props: sliderPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("PROGRESS_BAR"),
    order: z.number().int().min(0),
    props: progressBarPropsSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("PAGE_INDICATOR"),
    order: z.number().int().min(0),
    props: pageIndicatorPropsSchema,
  }),
]);

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
});

export const screenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Screen name is required").max(50),
  order: z.number().int().min(0),
  style: screenStyleSchema.optional(),
  components: z.array(componentSchema).max(20, "A screen can have at most 20 components"),
});

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
});

export const flowConfigSchema = z.object({
  screens: z.array(screenSchema)
    .min(1, "Flow must have at least one screen")
    .max(20, "Flow can have at most 20 screens"),
  settings: flowSettingsSchema.optional(),
});

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