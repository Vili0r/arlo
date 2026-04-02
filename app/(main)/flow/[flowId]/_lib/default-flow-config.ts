import type { FlowConfig } from "@/lib/types";

export const DEFAULT_FLOW_CONFIG: FlowConfig = {
  screens: [
    {
      id: "screen_1",
      name: "Welcome",
      order: 0,
      layoutMode: "absolute",
      style: { backgroundColor: "#FFFFFF", padding: 24 },
      components: [],
    },
  ],
  settings: {
    dismissible: true,
    showProgressBar: true,
    transitionAnimation: "slide",
  },
};
