import {
  Type,
  Image,
  Video,
  Smile,
  Rows3,
  PanelBottom,
  Columns2,
  MousePointerClick,
  ToggleLeft,
  SlidersHorizontal,
  GalleryHorizontal,
  Star,
  ListChecks,
  Award,
  Layers,
  BoxSelect,
  PlusCircle,
  Map,
  LayoutTemplate,
  Settings2,
} from "lucide-react";

export const COMPONENT_TYPES = [
  // Content
  { type: "TEXT", label: "Text", icon: Type, category: "Content", color: "orange" },
  { type: "IMAGE", label: "Image", icon: Image, category: "Content", color: "blue" },
  { type: "VIDEO", label: "Video", icon: Video, category: "Content", color: "rose" },
  { type: "ICON_LIBRARY", label: "Icon", icon: Smile, category: "Content", color: "cyan" },
  // Layout
  { type: "STACK", label: "Stack", icon: Rows3, category: "Layout", color: "slate" },
  { type: "FOOTER", label: "Footer", icon: PanelBottom, category: "Layout", color: "zinc" },
  { type: "TAB_BUTTON", label: "Tab Button", icon: Columns2, category: "Layout", color: "teal" },
  // Interactive
  { type: "BUTTON", label: "Button", icon: MousePointerClick, category: "Interactive", color: "emerald" },
  { type: "TEXT_INPUT", label: "Text Input", icon: Type, category: "Interactive", color: "purple" },
  { type: "SINGLE_SELECT", label: "Single Select", icon: ToggleLeft, category: "Interactive", color: "indigo" },
  { type: "MULTI_SELECT", label: "Multi Select", icon: ToggleLeft, category: "Interactive", color: "pink" },
  { type: "SLIDER", label: "Slider", icon: SlidersHorizontal, category: "Interactive", color: "amber" },
  // Rich
  { type: "CAROUSEL", label: "Carousel", icon: GalleryHorizontal, category: "Rich", color: "violet" },
  { type: "SOCIAL_PROOF", label: "Social Proof", icon: Star, category: "Rich", color: "yellow" },
  { type: "FEATURE_LIST", label: "Feature List", icon: ListChecks, category: "Rich", color: "lime" },
  { type: "AWARD", label: "Award", icon: Award, category: "Rich", color: "gold" },
] as const;

export const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-400" },
  pink: { bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
  slate: { bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400" },
  zinc: { bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-400" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-400" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400" },
  lime: { bg: "bg-lime-500/10", border: "border-lime-500/20", text: "text-lime-400" },
  gold: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
};

export const SIDEBAR_TABS = [
  { id: "screens" as const, label: "Screens", icon: Layers },
  { id: "settings" as const, label: "Settings", icon: Settings2 },
  { id: "add" as const, label: "Components", icon: PlusCircle },
  { id: "templates" as const, label: "Templates", icon: LayoutTemplate }, 
] as const;

export type SidebarTab = (typeof SIDEBAR_TABS)[number]["id"];