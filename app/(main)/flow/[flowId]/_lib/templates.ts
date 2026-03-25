import type { Screen, FlowComponent } from "@/lib/types";

/* ════════════════════════════════════════════════════════════
   ONBOARDING FLOW TEMPLATES
   
   Common screen patterns used across top mobile apps
   (Cal AI, Duolingo, Headspace, Calm, Noom, etc.)
   
   Each template is a factory function returning a Screen
   with pre-configured components. All text, colours, and
   options are customisable after insertion.
   ════════════════════════════════════════════════════════════ */

let _counter = 0;
function uid() {
  _counter++;
  return `tpl_${Date.now()}_${_counter}`;
}

function comp(
  type: string,
  order: number,
  props: Record<string, unknown>,
): FlowComponent {
  return { id: uid(), type, order, props } as FlowComponent;
}

/* ─── Template metadata (for the picker UI) ───────────── */

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** Emoji shown in the picker card */
  icon: string;
  /** Tags for search/filtering */
  tags: string[];
  /** Factory that produces a ready-to-use Screen */
  build: () => Screen;
}

export interface FlowPresetDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  audience: string;
  accent: string;
  templateIds: string[];
}

export type TemplateCategory =
  | "welcome"
  | "question"
  | "input"
  | "value-prop"
  | "social-proof"
  | "permission"
  | "paywall";

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
  color: string;
}[] = [
  { id: "welcome", label: "Welcome", color: "#3B82F6" },
  { id: "question", label: "Questions", color: "#8B5CF6" },
  { id: "input", label: "Inputs", color: "#F59E0B" },
  { id: "value-prop", label: "Value Props", color: "#10B981" },
  { id: "social-proof", label: "Social Proof", color: "#EC4899" },
  { id: "permission", label: "Permissions", color: "#6366F1" },
  { id: "paywall", label: "Paywall", color: "#EF4444" },
];

/* ═══════════════════════════════════════════════════════════
   1. WELCOME / HERO SCREEN
   ═══════════════════════════════════════════════════════════ */

const welcomeHero: TemplateDefinition = {
  id: "welcome-hero",
  name: "Welcome Hero",
  description: "App screenshot, bold headline, Get Started CTA and sign-in link",
  category: "welcome",
  icon: "🚀",
  tags: ["welcome", "hero", "get started", "landing"],
  build: () => ({
    id: uid(),
    name: "Welcome",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("IMAGE", 0, {
        src: "",
        placeholder: "App screenshot or hero illustration",
        height: 320,
        borderRadius: 24,
        objectFit: "contain",
      }),
      comp("TEXT", 1, {
        text: "Your headline goes here",
        fontSize: 32,
        fontWeight: "800",
        color: "#000000",
        textAlign: "center",
        marginTop: 24,
      }),
      comp("BUTTON", 2, {
        label: "Get Started",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
      comp("BUTTON", 3, {
        label: "Already have an account? Sign In",
        backgroundColor: "transparent",
        textColor: "#000000",
        fontSize: 15,
        fontWeight: "500",
        fullWidth: true,
        action: "custom",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   2. SINGLE SELECT — Simple text options
   ═══════════════════════════════════════════════════════════ */

const singleSelectSimple: TemplateDefinition = {
  id: "single-select-simple",
  name: "Single Select",
  description: "Question with simple text option cards and a Continue button",
  category: "question",
  icon: "☝️",
  tags: ["single select", "question", "choice", "gender", "goal"],
  build: () => ({
    id: uid(),
    name: "Question",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Choose your option",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("TEXT", 1, {
        text: "This will be used to personalise your experience.",
        fontSize: 15,
        fontWeight: "400",
        color: "#888888",
        marginTop: 8,
      }),
      comp("SINGLE_SELECT", 2, {
        options: [
          { id: "opt_1", label: "Option A", value: "a" },
          { id: "opt_2", label: "Option B", value: "b" },
          { id: "opt_3", label: "Option C", value: "c" },
        ],
        style: "card",
        backgroundColor: "#F5F5F5",
        selectedBackgroundColor: "#000000",
        selectedTextColor: "#FFFFFF",
        textColor: "#000000",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "500",
        gap: 12,
        paddingVertical: 20,
        marginTop: 32,
        propertyKey: "selected_option",
      }),
      comp("BUTTON", 3, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   3. SINGLE SELECT — With icons
   ═══════════════════════════════════════════════════════════ */

const singleSelectIcons: TemplateDefinition = {
  id: "single-select-icons",
  name: "Single Select + Icons",
  description: "Option cards with icons, title, and description",
  category: "question",
  icon: "🎯",
  tags: ["single select", "icons", "workout", "frequency", "activity"],
  build: () => ({
    id: uid(),
    name: "Activity Level",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "How active are you?",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("TEXT", 1, {
        text: "This will be used to calibrate your custom plan.",
        fontSize: 15,
        fontWeight: "400",
        color: "#888888",
        marginTop: 8,
      }),
      comp("SINGLE_SELECT", 2, {
        options: [
          { id: "opt_1", label: "0–2", subtitle: "Light activity", value: "low", icon: "●" },
          { id: "opt_2", label: "3–5", subtitle: "Moderate activity", value: "mid", icon: "●●" },
          { id: "opt_3", label: "6+", subtitle: "Very active", value: "high", icon: "●●●" },
        ],
        style: "icon-card",
        backgroundColor: "#F5F5F5",
        selectedBackgroundColor: "#000000",
        selectedTextColor: "#FFFFFF",
        textColor: "#000000",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        subtitleFontSize: 14,
        gap: 12,
        paddingVertical: 18,
        paddingHorizontal: 16,
        marginTop: 32,
        propertyKey: "activity_level",
      }),
      comp("BUTTON", 3, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   4. MULTI SELECT — With icons
   ═══════════════════════════════════════════════════════════ */

const multiSelectIcons: TemplateDefinition = {
  id: "multi-select-icons",
  name: "Multi Select + Icons",
  description: "Pick multiple options with icons — goals, barriers, interests",
  category: "question",
  icon: "✅",
  tags: ["multi select", "goals", "barriers", "interests", "multiple"],
  build: () => ({
    id: uid(),
    name: "Goals",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "What would you like to accomplish?",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("MULTI_SELECT", 1, {
        options: [
          { id: "opt_1", label: "Eat and live healthier", value: "health", icon: "🍎" },
          { id: "opt_2", label: "Boost my energy and mood", value: "energy", icon: "☀️" },
          { id: "opt_3", label: "Stay motivated and consistent", value: "motivation", icon: "💪" },
          { id: "opt_4", label: "Feel better about my body", value: "body", icon: "🧘" },
        ],
        style: "icon-card",
        backgroundColor: "#F5F5F5",
        selectedBackgroundColor: "#000000",
        selectedTextColor: "#FFFFFF",
        textColor: "#000000",
        borderRadius: 16,
        fontSize: 16,
        fontWeight: "500",
        gap: 8,
        paddingVertical: 18,
        paddingHorizontal: 16,
        marginTop: 24,
        propertyKey: "goals",
      }),
      comp("BUTTON", 2, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   5. YES / NO — Binary choice with icons
   ═══════════════════════════════════════════════════════════ */

const binaryChoice: TemplateDefinition = {
  id: "binary-choice",
  name: "Yes / No",
  description: "Simple binary question with thumb icons",
  category: "question",
  icon: "👍",
  tags: ["yes", "no", "binary", "boolean", "simple"],
  build: () => ({
    id: uid(),
    name: "Yes / No",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Have you tried similar apps before?",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("SINGLE_SELECT", 1, {
        options: [
          { id: "opt_1", label: "Yes", value: "yes", icon: "👍" },
          { id: "opt_2", label: "No", value: "no", icon: "👎" },
        ],
        style: "icon-card",
        backgroundColor: "#F5F5F5",
        selectedBackgroundColor: "#000000",
        selectedTextColor: "#FFFFFF",
        textColor: "#000000",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        gap: 12,
        paddingVertical: 20,
        marginTop: 48,
        propertyKey: "tried_before",
      }),
      comp("BUTTON", 2, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   6. ATTRIBUTION — "Where did you hear about us?"
   ═══════════════════════════════════════════════════════════ */

const attribution: TemplateDefinition = {
  id: "attribution",
  name: "Attribution Source",
  description: "Where did you hear about us? with branded channel icons",
  category: "question",
  icon: "📢",
  tags: ["attribution", "source", "hear about", "marketing", "channel"],
  build: () => ({
    id: uid(),
    name: "Attribution",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Where did you hear about us?",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("SINGLE_SELECT", 1, {
        options: [
          { id: "opt_1", label: "Instagram", value: "instagram", icon: "📷" },
          { id: "opt_2", label: "TikTok", value: "tiktok", icon: "🎵" },
          { id: "opt_3", label: "Friend or family", value: "referral", icon: "👥" },
          { id: "opt_4", label: "App Store", value: "app_store", icon: "📱" },
          { id: "opt_5", label: "Google", value: "google", icon: "🔍" },
          { id: "opt_6", label: "TV", value: "tv", icon: "📺" },
          { id: "opt_7", label: "Other", value: "other", icon: "💬" },
        ],
        style: "icon-card",
        backgroundColor: "#F5F5F5",
        selectedBackgroundColor: "#000000",
        selectedTextColor: "#FFFFFF",
        textColor: "#000000",
        borderRadius: 16,
        fontSize: 16,
        fontWeight: "500",
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginTop: 16,
        propertyKey: "attribution_source",
      }),
      comp("BUTTON", 2, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   7. DATE PICKER — Birthday / date of birth
   ═══════════════════════════════════════════════════════════ */

const datePicker: TemplateDefinition = {
  id: "date-picker",
  name: "Date Picker",
  description: "Scrollable date picker for birthday or date selection",
  category: "input",
  icon: "📅",
  tags: ["date", "birthday", "born", "dob", "picker", "age"],
  build: () => ({
    id: uid(),
    name: "Birthday",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "When were you born?",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("TEXT", 1, {
        text: "This will be used to calibrate your custom plan.",
        fontSize: 15,
        fontWeight: "400",
        color: "#888888",
        marginTop: 8,
      }),
      comp("SLIDER", 2, {
        type: "date-picker",
        mode: "date",
        defaultMonth: "January",
        defaultDay: 1,
        defaultYear: 1995,
        marginTop: 48,
        propertyKey: "date_of_birth",
      }),
      comp("BUTTON", 3, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   8. MEASUREMENT PICKER — Height & weight
   ═══════════════════════════════════════════════════════════ */

const measurementPicker: TemplateDefinition = {
  id: "measurement-picker",
  name: "Height & Weight",
  description: "Dual scroll pickers with imperial/metric toggle",
  category: "input",
  icon: "⚖️",
  tags: ["height", "weight", "measurement", "bmi", "metric", "imperial"],
  build: () => ({
    id: uid(),
    name: "Height & Weight",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Height & weight",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("TEXT", 1, {
        text: "This will be used to calibrate your custom plan.",
        fontSize: 15,
        fontWeight: "400",
        color: "#888888",
        marginTop: 8,
      }),
      comp("SLIDER", 2, {
        type: "unit-toggle",
        options: ["Imperial", "Metric"],
        defaultIndex: 1,
        marginTop: 32,
        propertyKey: "unit_system",
      }),
      comp("SLIDER", 3, {
        type: "dual-picker",
        leftLabel: "Height",
        rightLabel: "Weight",
        leftUnit: "cm",
        rightUnit: "kg",
        leftDefault: 175,
        rightDefault: 70,
        marginTop: 16,
        propertyKey: "body_measurements",
      }),
      comp("BUTTON", 4, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   9. VALUE PROP — Chart / data visualisation
   ═══════════════════════════════════════════════════════════ */

const valuePropChart: TemplateDefinition = {
  id: "value-prop-chart",
  name: "Value Prop + Chart",
  description: "Bold claim backed by a data visualisation or chart image",
  category: "value-prop",
  icon: "📈",
  tags: ["value", "chart", "results", "data", "proof", "graph"],
  build: () => ({
    id: uid(),
    name: "Results",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Our app creates long-term results",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("IMAGE", 1, {
        src: "",
        placeholder: "Chart or data visualisation image",
        height: 260,
        borderRadius: 16,
        objectFit: "contain",
        backgroundColor: "#F8F8F8",
        marginTop: 32,
      }),
      comp("TEXT", 2, {
        text: "80% of users maintain their progress even 6 months later",
        fontSize: 14,
        fontWeight: "400",
        color: "#666666",
        textAlign: "center",
        marginTop: 16,
      }),
      comp("BUTTON", 3, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   10. VALUE PROP — Feature explanation with image
   ═══════════════════════════════════════════════════════════ */

const featureExplainer: TemplateDefinition = {
  id: "feature-explainer",
  name: "Feature Explainer",
  description: "Headline + image + description with Yes/No or dual CTAs",
  category: "value-prop",
  icon: "✨",
  tags: ["feature", "explain", "image", "calories", "rollover"],
  build: () => ({
    id: uid(),
    name: "Feature",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Add calories burned back to your daily goal?",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("IMAGE", 1, {
        src: "",
        placeholder: "Feature illustration or screenshot",
        height: 280,
        borderRadius: 16,
        objectFit: "contain",
        marginTop: 24,
      }),
      comp("STACK", 2, {
        direction: "horizontal",
        gap: 12,
        children: [
          {
            type: "BUTTON",
            props: {
              label: "No",
              backgroundColor: "#000000",
              textColor: "#FFFFFF",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: "600",
              paddingVertical: 18,
              flex: 1,
              action: "next",
            },
          },
          {
            type: "BUTTON",
            props: {
              label: "Yes",
              backgroundColor: "#000000",
              textColor: "#FFFFFF",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: "600",
              paddingVertical: 18,
              flex: 1,
              action: "next",
            },
          },
        ],
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   11. TRUST / THANK YOU — Illustration + privacy note
   ═══════════════════════════════════════════════════════════ */

const trustScreen: TemplateDefinition = {
  id: "trust-screen",
  name: "Trust & Privacy",
  description: "Thank you message with illustration and privacy commitment",
  category: "value-prop",
  icon: "🔒",
  tags: ["trust", "privacy", "thank you", "security", "data"],
  build: () => ({
    id: uid(),
    name: "Thank You",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("IMAGE", 0, {
        src: "",
        placeholder: "Illustration (hands, celebration, etc.)",
        height: 200,
        objectFit: "contain",
        marginTop: 24,
      }),
      comp("TEXT", 1, {
        text: "Thank you for trusting us",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
        textAlign: "center",
        marginTop: 24,
      }),
      comp("TEXT", 2, {
        text: "Now let's personalise the app for you...",
        fontSize: 15,
        fontWeight: "400",
        color: "#888888",
        textAlign: "center",
        marginTop: 8,
      }),
      comp("STACK", 3, {
        direction: "vertical",
        backgroundColor: "#F8F8F8",
        borderRadius: 16,
        padding: 20,
        marginTop: 32,
        gap: 8,
        children: [
          {
            type: "TEXT",
            props: {
              text: "🔒",
              fontSize: 24,
              textAlign: "center",
            },
          },
          {
            type: "TEXT",
            props: {
              text: "Your privacy and security matter to us.",
              fontSize: 15,
              fontWeight: "600",
              color: "#000000",
              textAlign: "center",
            },
          },
          {
            type: "TEXT",
            props: {
              text: "We promise to always keep your personal information private and secure.",
              fontSize: 13,
              fontWeight: "400",
              color: "#888888",
              textAlign: "center",
            },
          },
        ],
      }),
      comp("BUTTON", 4, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   12. SOCIAL PROOF / RATING — Reviews + testimonials
   ═══════════════════════════════════════════════════════════ */

const socialProofRating: TemplateDefinition = {
  id: "social-proof-rating",
  name: "Ratings & Reviews",
  description: "App Store rating badge + user testimonial card",
  category: "social-proof",
  icon: "⭐",
  tags: ["rating", "review", "testimonial", "social proof", "stars"],
  build: () => ({
    id: uid(),
    name: "Social Proof",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Join millions of happy users",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
      }),
      comp("STACK", 1, {
        direction: "vertical",
        backgroundColor: "#F8F8F8",
        borderRadius: 20,
        padding: 24,
        marginTop: 20,
        gap: 4,
        alignment: "center",
        children: [
          {
            type: "TEXT",
            props: { text: "4.8 ⭐⭐⭐⭐⭐", fontSize: 28, fontWeight: "700", textAlign: "center" },
          },
          {
            type: "TEXT",
            props: { text: "200K+ App Ratings", fontSize: 14, color: "#888888", textAlign: "center" },
          },
        ],
      }),
      comp("TEXT", 2, {
        text: "Made for people like you",
        fontSize: 20,
        fontWeight: "700",
        color: "#000000",
        textAlign: "center",
        marginTop: 24,
      }),
      comp("IMAGE", 3, {
        src: "",
        placeholder: "Avatar group image (3 user photos)",
        height: 80,
        objectFit: "contain",
        marginTop: 8,
      }),
      comp("TEXT", 4, {
        text: "5M+ users",
        fontSize: 14,
        fontWeight: "500",
        color: "#888888",
        textAlign: "center",
        marginTop: 4,
      }),
      comp("STACK", 5, {
        direction: "vertical",
        backgroundColor: "#F8F8F8",
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
        gap: 8,
        children: [
          {
            type: "TEXT",
            props: {
              text: "\"I saw results in 2 months! This app completely changed my routine.\"",
              fontSize: 14,
              fontWeight: "400",
              color: "#333333",
              fontStyle: "italic",
            },
          },
          {
            type: "TEXT",
            props: { text: "— Alex M. ⭐⭐⭐⭐⭐", fontSize: 13, color: "#888888" },
          },
        ],
      }),
      comp("BUTTON", 6, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   13. PERMISSION — Notifications / Health / Location
   ═══════════════════════════════════════════════════════════ */

const permissionRequest: TemplateDefinition = {
  id: "permission-request",
  name: "Permission Request",
  description: "Pre-permission screen for notifications, health, or location",
  category: "permission",
  icon: "🔔",
  tags: ["permission", "notification", "health", "location", "allow"],
  build: () => ({
    id: uid(),
    name: "Notifications",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("TEXT", 0, {
        text: "Reach your goals with notifications",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
        textAlign: "center",
        marginTop: 80,
      }),
      comp("STACK", 1, {
        direction: "vertical",
        backgroundColor: "#E8E8E8",
        borderRadius: 16,
        padding: 20,
        marginTop: 32,
        gap: 12,
        alignment: "center",
        children: [
          {
            type: "TEXT",
            props: {
              text: "\"App Name\" would like to send you Notifications",
              fontSize: 15,
              fontWeight: "600",
              color: "#000000",
              textAlign: "center",
            },
          },
          {
            type: "STACK",
            props: {
              direction: "horizontal",
              gap: 0,
              children: [
                {
                  type: "BUTTON",
                  props: {
                    label: "Don't Allow",
                    backgroundColor: "transparent",
                    textColor: "#333333",
                    fontSize: 15,
                    flex: 1,
                  },
                },
                {
                  type: "BUTTON",
                  props: {
                    label: "Allow",
                    backgroundColor: "#333333",
                    textColor: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "600",
                    flex: 1,
                    borderRadius: 8,
                  },
                },
              ],
            },
          },
        ],
      }),
      comp("TEXT", 2, {
        text: "👆",
        fontSize: 32,
        textAlign: "center",
        marginTop: 8,
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   14. INTEGRATION — Connect to Apple Health / Google Fit
   ═══════════════════════════════════════════════════════════ */

const integrationConnect: TemplateDefinition = {
  id: "integration-connect",
  name: "Integration Connect",
  description: "Connect to Apple Health, Google Fit, or other services",
  category: "permission",
  icon: "🔗",
  tags: ["integration", "health", "apple", "google fit", "connect", "sync"],
  build: () => ({
    id: uid(),
    name: "Connect Health",
    order: 0,
    style: { backgroundColor: "#FFFFFF", padding: 24 },
    components: [
      comp("IMAGE", 0, {
        src: "",
        placeholder: "Integration illustration (health app icons, arrows)",
        height: 240,
        objectFit: "contain",
        marginTop: 24,
      }),
      comp("TEXT", 1, {
        text: "Connect to Apple Health",
        fontSize: 28,
        fontWeight: "800",
        color: "#000000",
        marginTop: 24,
      }),
      comp("TEXT", 2, {
        text: "Sync your daily activity to get the most accurate experience and personalised insights.",
        fontSize: 15,
        fontWeight: "400",
        color: "#888888",
        marginTop: 8,
        lineHeight: 1.5,
      }),
      comp("BUTTON", 3, {
        label: "Continue",
        backgroundColor: "#000000",
        textColor: "#FFFFFF",
        borderRadius: 16,
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 18,
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
      comp("BUTTON", 4, {
        label: "Not now",
        backgroundColor: "transparent",
        textColor: "#000000",
        fontSize: 15,
        fontWeight: "500",
        fullWidth: true,
        action: "next",
        position: "bottom",
      }),
    ],
  }),
};

/* ═══════════════════════════════════════════════════════════
   ALL TEMPLATES — exported registry
   ═══════════════════════════════════════════════════════════ */

export const ALL_TEMPLATES: TemplateDefinition[] = [
  welcomeHero,
  singleSelectSimple,
  singleSelectIcons,
  multiSelectIcons,
  binaryChoice,
  attribution,
  datePicker,
  measurementPicker,
  valuePropChart,
  featureExplainer,
  trustScreen,
  socialProofRating,
  permissionRequest,
  integrationConnect,
];

export const FLOW_PRESETS: FlowPresetDefinition[] = [
  {
    id: "ai-coach",
    name: "AI Coach",
    icon: "🧠",
    description: "Intent capture, personalisation, trust, and a premium finish.",
    audience: "Coaching, assistant, and guided-product apps",
    accent: "#7C3AED",
    templateIds: [
      "welcome-hero",
      "single-select-simple",
      "multi-select-icons",
      "binary-choice",
      "value-prop-chart",
      "trust-screen",
      "social-proof-rating",
      "permission-request",
    ],
  },
  {
    id: "language-sprint",
    name: "Language Sprint",
    icon: "🗣️",
    description: "Momentum-first onboarding with fast picks and a habit-building arc.",
    audience: "Learning, habit, and practice apps",
    accent: "#22C55E",
    templateIds: [
      "welcome-hero",
      "single-select-icons",
      "binary-choice",
      "multi-select-icons",
      "trust-screen",
      "social-proof-rating",
      "permission-request",
    ],
  },
  {
    id: "run-club",
    name: "Run Club",
    icon: "🏃",
    description: "Goal setting, activity level, integrations, and proof of progress.",
    audience: "Fitness, running, and performance products",
    accent: "#F97316",
    templateIds: [
      "welcome-hero",
      "single-select-simple",
      "single-select-icons",
      "measurement-picker",
      "integration-connect",
      "value-prop-chart",
      "permission-request",
    ],
  },
  {
    id: "creator-funnel",
    name: "Creator Funnel",
    icon: "🎥",
    description: "Acquisition-aware onboarding with attribution, role, and value proof.",
    audience: "Consumer subscriptions and creator tools",
    accent: "#EC4899",
    templateIds: [
      "welcome-hero",
      "attribution",
      "single-select-simple",
      "feature-explainer",
      "social-proof-rating",
      "trust-screen",
    ],
  },
  {
    id: "minimal-activation",
    name: "Minimal Activation",
    icon: "✨",
    description: "A compact three-screen starter for fast shipping and iteration.",
    audience: "Early-stage apps and MVP onboarding",
    accent: "#38BDF8",
    templateIds: ["welcome-hero", "single-select-icons", "trust-screen"],
  },
];

export function getTemplatesByCategory(
  category: TemplateCategory,
): TemplateDefinition[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(query: string): TemplateDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_TEMPLATES;
  return ALL_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q)),
  );
}
