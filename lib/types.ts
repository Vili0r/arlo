import { Prisma } from "../app/generated/prisma/client";

// ============================================
// PRISMA QUERY INCLUDES
// Reusable include objects for consistent
// data fetching across actions and components.
// ============================================

export const projectListInclude = {
  flows: {
    select: {
      id: true,
      status: true,
    },
  },
  apiKeys: {
    select: {
      id: true,
      environment: true,
    },
  },
  _count: {
    select: {
      flows: true,
      apiKeys: true,
    },
  },
} satisfies Prisma.ProjectInclude;

export const projectDetailInclude = {
  flows: {
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      publishedVersion: {
        select: {
          id: true,
          version: true,
          publishedAt: true,
        },
      },
      _count: {
        select: {
          versions: true,
        },
      },
    },
  },
  apiKeys: {
    select: {
      id: true,
      name: true,
      prefix: true,
      environment: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.ProjectInclude;

export const flowDetailInclude = {
  publishedVersion: true,
  versions: {
    orderBy: {
      version: "desc",
    },
    select: {
      id: true,
      version: true,
      changelog: true,
      publishedAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.FlowInclude;

export const flowWithConfigInclude = {
  publishedVersion: true,
  versions: {
    orderBy: {
      version: "desc",
    },
    take: 1,
  },
} satisfies Prisma.FlowInclude;

// ============================================
// PRISMA DERIVED TYPES
// Inferred from Prisma schema + includes.
// Use these in components and actions.
// ============================================

export type ProjectListItem = Prisma.ProjectGetPayload<{
  include: typeof projectListInclude;
}>;

export type ProjectDetail = Prisma.ProjectGetPayload<{
  include: typeof projectDetailInclude;
}>;

export type FlowDetail = Prisma.FlowGetPayload<{
  include: typeof flowDetailInclude;
}>;

export type FlowWithConfig = Prisma.FlowGetPayload<{
  include: typeof flowWithConfigInclude;
}>;

export type FlowVersionSummary = {
  id: string;
  version: number;
  changelog: string | null;
  publishedAt: Date | null;
  createdAt: Date;
};

export type ApiKeySafe = {
  id: string;
  name: string;
  prefix: string;
  environment: "DEVELOPMENT" | "PRODUCTION";
  lastUsedAt: Date | null;
  createdAt: Date;
};

// ============================================
// FLOW CONFIG TYPES
// TypeScript types for the JSON config stored
// in FlowVersion.config. These mirror the Zod
// schemas in validations.ts but are used for
// type-checking in components and the SDK.
// ============================================

export type ComponentType =
  | "TEXT"
  | "IMAGE"
  | "LOTTIE"
  | "VIDEO"
  | "ICON"
  | "ICON_LIBRARY"
  | "BUTTON"
  | "TEXT_INPUT"
  | "MULTI_SELECT"
  | "SINGLE_SELECT"
  | "SLIDER"
  | "PROGRESS_BAR"
  | "PAGE_INDICATOR"
  | "STACK"
  | "FOOTER"
  | "TAB_BUTTON"
  | "CAROUSEL"
  | "SOCIAL_PROOF"
  | "FEATURE_LIST"
  | "AWARD";

export type ButtonAction =
  | "NEXT_SCREEN"
  | "PREV_SCREEN"
  | "SKIP_FLOW"
  | "OPEN_URL"
  | "CUSTOM_EVENT";

export type TransitionAnimation = "slide" | "fade" | "none";

export type TextAlign = "left" | "center" | "right";

export type FontWeight = "normal" | "medium" | "semibold" | "bold";

// Component props

export interface TextProps {
  content: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  color?: string;
  textAlign?: TextAlign;
  lineHeight?: number;
  opacity?: number;
}

export interface ImageProps {
  src: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  alt?: string;
}

export interface LottieProps {
  src: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

export interface VideoProps {
  src: string;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  posterUrl?: string;
}

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export interface ButtonStyle {
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

export interface ButtonProps {
  label: string;
  action: ButtonAction;
  url?: string;
  eventName?: string;
  style?: ButtonStyle;
}

export interface TextInputProps {
  placeholder?: string;
  label?: string;
  fieldKey: string;
  required?: boolean;
  keyboardType?: "default" | "email" | "numeric" | "phone";
  maxLength?: number;
}

export interface SelectOption {
  id: string;
  label: string;
  iconName?: string;
}

export interface MultiSelectProps {
  label?: string;
  fieldKey: string;
  options: SelectOption[];
  minSelections?: number;
  maxSelections?: number;
  required?: boolean;
}

export interface SingleSelectProps {
  label?: string;
  fieldKey: string;
  options: SelectOption[];
  required?: boolean;
}

export interface SliderProps {
  label?: string;
  fieldKey: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface ProgressBarProps {
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export interface PageIndicatorProps {
  activeColor?: string;
  inactiveColor?: string;
  size?: number;
}

export interface IconLibraryProps {
  iconName: string;
  size?: number;
  color?: string;
  width?: number;
  height?: number;
  opacity?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  marginVertical?: number;
  marginHorizontal?: number;
  backgroundColor?: string;
}

export interface StackProps {
  direction?: "vertical" | "horizontal";
  gap?: number;
  padding?: number;
  backgroundColor?: string;
  borderRadius?: number;
}

export interface FooterProps {
  text: string;
  textColor?: string;
  fontSize?: number;
  backgroundColor?: string;
  showDivider?: boolean;
}

export interface TabButtonTab {
  id: string;
  label: string;
  active?: boolean;
}

export interface TabButtonProps {
  tabs: TabButtonTab[];
  activeColor?: string;
  inactiveColor?: string;
}

export interface CarouselItem {
  id: string;
  imageSrc?: string;
  title?: string;
  subtitle?: string;
}

export interface CarouselProps {
  variant?: "image" | "card";
  items: CarouselItem[];
  height?: number;
  borderRadius?: number;
  showDots?: boolean;
}

export interface SocialProofReview {
  id: string;
  author: string;
  rating: number;
  text?: string;
  avatar?: string;
}

export interface SocialProofProps {
  rating?: number;
  totalReviews?: number;
  reviews?: SocialProofReview[];
  showStars?: boolean;
  compact?: boolean;
}

export interface FeatureItem {
  id: string;
  icon?: string;
  label: string;
}

export interface FeatureListProps {
  title?: string;
  features: FeatureItem[];
  iconColor?: string;
  textColor?: string;
}

export interface AwardProps {
  variant?: "badge" | "laurel" | "minimal";
  title: string;
  subtitle?: string;
  issuer?: string;
  iconSrc?: string;
  showLaurels?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

// Component union — discriminated by type

export type FlowComponent =
  | { id: string; type: "TEXT"; order: number; props: TextProps }
  | { id: string; type: "IMAGE"; order: number; props: ImageProps }
  | { id: string; type: "LOTTIE"; order: number; props: LottieProps }
  | { id: string; type: "VIDEO"; order: number; props: VideoProps }
  | { id: string; type: "ICON"; order: number; props: IconProps }
  | { id: string; type: "ICON_LIBRARY"; order: number; props: IconLibraryProps }
  | { id: string; type: "BUTTON"; order: number; props: ButtonProps }
  | { id: string; type: "TEXT_INPUT"; order: number; props: TextInputProps }
  | { id: string; type: "MULTI_SELECT"; order: number; props: MultiSelectProps }
  | { id: string; type: "SINGLE_SELECT"; order: number; props: SingleSelectProps }
  | { id: string; type: "SLIDER"; order: number; props: SliderProps }
  | { id: string; type: "PROGRESS_BAR"; order: number; props: ProgressBarProps }
  | { id: string; type: "PAGE_INDICATOR"; order: number; props: PageIndicatorProps }
  | { id: string; type: "STACK"; order: number; props: StackProps }
  | { id: string; type: "FOOTER"; order: number; props: FooterProps }
  | { id: string; type: "TAB_BUTTON"; order: number; props: TabButtonProps }
  | { id: string; type: "CAROUSEL"; order: number; props: CarouselProps }
  | { id: string; type: "SOCIAL_PROOF"; order: number; props: SocialProofProps }
  | { id: string; type: "FEATURE_LIST"; order: number; props: FeatureListProps }
  | { id: string; type: "AWARD"; order: number; props: AwardProps };

// Screen and config

export interface ScreenStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingHorizontal?: number;
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}

export interface Screen {
  id: string;
  name: string;
  order: number;
  style?: ScreenStyle;
  components: FlowComponent[];
}

export interface FlowSettings {
  dismissible?: boolean;
  showProgressBar?: boolean;
  progressBarColor?: string;
  transitionAnimation?: TransitionAnimation;
  showBackButton?: boolean;
  showSkipButton?: boolean;
  skipButtonLabel?: string;
}

export interface FlowConfig {
  screens: Screen[];
  settings?: FlowSettings;
}

// ============================================
// SDK API RESPONSE TYPES
// What the SDK receives when it fetches a flow.
// ============================================

export interface SDKFlowResponse {
  flow: {
    slug: string;
    version: number;
    config: FlowConfig;
  };
}

export interface SDKErrorResponse {
  error: string;
  code: "FLOW_NOT_FOUND" | "FLOW_NOT_PUBLISHED" | "INVALID_API_KEY" | "PROJECT_NOT_FOUND";
}

// ============================================
// SDK EVENT TYPES
// Events the SDK fires back for analytics.
// ============================================

export interface SDKBaseEvent {
  flowSlug: string;
  flowVersion: number;
  sessionId: string;
  timestamp: string;
}

export interface SDKFlowStartedEvent extends SDKBaseEvent {
  event: "flow_started";
}

export interface SDKFlowCompletedEvent extends SDKBaseEvent {
  event: "flow_completed";
  totalScreens: number;
  durationMs: number;
}

export interface SDKFlowDismissedEvent extends SDKBaseEvent {
  event: "flow_dismissed";
  screenId: string;
  screenIndex: number;
}

export interface SDKScreenViewedEvent extends SDKBaseEvent {
  event: "screen_viewed";
  screenId: string;
  screenIndex: number;
}

export interface SDKComponentInteractionEvent extends SDKBaseEvent {
  event: "component_interaction";
  screenId: string;
  componentId: string;
  componentType: ComponentType;
  action?: ButtonAction;
  value?: string | string[] | number;
  fieldKey?: string;
}

export type SDKEvent =
  | SDKFlowStartedEvent
  | SDKFlowCompletedEvent
  | SDKFlowDismissedEvent
  | SDKScreenViewedEvent
  | SDKComponentInteractionEvent;

// ============================================
// DASHBOARD COMPONENT PROPS
// Props for reusable dashboard UI components.
// ============================================

export interface ProjectCardProps {
  project: ProjectListItem;
}

export interface FlowCardProps {
  flow: FlowDetail;
  projectId: string;
}

export interface ApiKeyRowProps {
  apiKey: ApiKeySafe;
  onRevoke: (id: string) => void;
}

export interface FlowBuilderProps {
  flow: FlowWithConfig;
  projectId: string;
}

export interface ScreenEditorProps {
  screen: Screen;
  screenIndex: number;
  totalScreens: number;
  onUpdate: (screen: Screen) => void;
  onDelete: () => void;
  onReorder: (direction: "up" | "down") => void;
}

export interface ComponentEditorProps {
  component: FlowComponent;
  onUpdate: (component: FlowComponent) => void;
  onDelete: () => void;
}

export interface FlowPreviewProps {
  config: FlowConfig;
  currentScreen?: number;
}

export interface VersionHistoryProps {
  versions: FlowVersionSummary[];
  publishedVersionId: string | null;
  onPublish: (versionId: string) => void;
  onRestore: (versionId: string) => void;
}