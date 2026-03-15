import type { FlowComponent } from "@/lib/types";

export function createDefaultComponent(type: string, order: number): FlowComponent {
  const id = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const defaults: Record<string, () => FlowComponent> = {
    TEXT: () => ({ id, type: "TEXT", order, props: { content: "Your text here", fontSize: 18, fontWeight: "normal", color: "#1A1A1A", textAlign: "left" } }),
    IMAGE: () => ({ id, type: "IMAGE", order, props: { src: "", width: 300, height: 200, borderRadius: 12 } }),
    VIDEO: () => ({ id, type: "VIDEO", order, props: { src: "", posterSrc: "", autoplay: false, height: 200, borderRadius: 12 } }),
    ICON_LIBRARY: () => ({ id, type: "ICON_LIBRARY", order, props: { iconName: "star", size: 32, color: "#007AFF" } }),
    STACK: () => ({ id, type: "STACK", order, props: { direction: "vertical", gap: 12, padding: 16, backgroundColor: "#F8F8F8", borderRadius: 16 } }),
    FOOTER: () => ({ id, type: "FOOTER", order, props: { text: "Powered by your app", textColor: "#999999", fontSize: 12, backgroundColor: "transparent", showDivider: true } }),
    TAB_BUTTON: () => ({ id, type: "TAB_BUTTON", order, props: { tabs: [{ id: "tab_1", label: "Tab 1", active: true }, { id: "tab_2", label: "Tab 2", active: false }, { id: "tab_3", label: "Tab 3", active: false }], activeColor: "#007AFF", inactiveColor: "#999999" } }),
    BUTTON: () => ({ id, type: "BUTTON", order, props: { label: "Continue", action: "NEXT_SCREEN", style: { backgroundColor: "#007AFF", textColor: "#FFFFFF", borderRadius: 12 } } }),
    TEXT_INPUT: () => ({ id, type: "TEXT_INPUT", order, props: { placeholder: "Enter text...", fieldKey: "field_1", required: false } }),
    SINGLE_SELECT: () => ({ id, type: "SINGLE_SELECT", order, props: { label: "Choose one", fieldKey: "select_1", options: [{ id: "opt_1", label: "Option A" }, { id: "opt_2", label: "Option B" }] } }),
    MULTI_SELECT: () => ({ id, type: "MULTI_SELECT", order, props: { label: "Choose multiple", fieldKey: "multi_1", options: [{ id: "opt_1", label: "Option A" }, { id: "opt_2", label: "Option B" }] } }),
    SLIDER: () => ({ id, type: "SLIDER", order, props: { label: "How much?", fieldKey: "slider_1", min: 0, max: 100, step: 1, defaultValue: 50 } }),
    CAROUSEL: () => ({ id, type: "CAROUSEL", order, props: { variant: "image", items: [{ id: "item_1", imageSrc: "", title: "Slide 1", subtitle: "Description" }, { id: "item_2", imageSrc: "", title: "Slide 2", subtitle: "Description" }], height: 180, borderRadius: 16, showDots: true } }),
    SOCIAL_PROOF: () => ({ id, type: "SOCIAL_PROOF", order, props: { rating: 4.8, totalReviews: 12400, reviews: [{ id: "rev_1", author: "Sarah M.", rating: 5, text: "Absolutely love this app!", avatar: "" }, { id: "rev_2", author: "James K.", rating: 5, text: "Changed my daily routine for the better.", avatar: "" }], showStars: true, compact: false } }),
    FEATURE_LIST: () => ({ id, type: "FEATURE_LIST", order, props: { title: "What you get", features: [{ id: "f_1", icon: "check", label: "Unlimited access to all features" }, { id: "f_2", icon: "check", label: "Priority customer support" }, { id: "f_3", icon: "check", label: "Cloud sync across devices" }], iconColor: "#34C759", textColor: "#1A1A1A" } }),
    AWARD: () => ({ id, type: "AWARD", order, props: { variant: "badge", title: "App of the Year", subtitle: "2025 Design & Innovation", issuer: "App Store", iconSrc: "", showLaurels: true, backgroundColor: "#1C1C1E", textColor: "#FFFFFF" } }),
  };

  return (defaults[type] || defaults.TEXT)() as FlowComponent;
}
