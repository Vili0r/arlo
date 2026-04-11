import assert from "node:assert/strict";
import test from "node:test";

import { flowConfigSchema } from "../lib/validations";
import { sdkFlowResponseSchema } from "../packages/arlo-sdk/src/schema";

test("sdk accepts published flows with passthrough editor/runtime fields", () => {
  const response = {
    flow: {
      slug: "journal-onboarding",
      version: 3,
      config: {
        screens: [
          {
            id: "screen_intro",
            name: "Intro",
            order: 0,
            layoutMode: "absolute",
            customScreenKey: "journal_intro",
            customPayload: {
              theme: "paper",
            },
            animation: {
              type: "fade",
            },
            components: [
              {
                id: "cta_continue",
                type: "BUTTON",
                order: 0,
                animation: {
                  preset: "pulse",
                },
                interactions: [
                  {
                    id: "tap_continue",
                    trigger: "ON_PRESS",
                  },
                ],
                layout: {
                  position: "absolute",
                  x: 24,
                  y: 680,
                  width: 342,
                  height: 56,
                  zIndex: 1,
                  constraints: {
                    horizontal: "stretch",
                  },
                },
                props: {
                  label: "",
                  action: "NEXT_SCREEN",
                  showIcon: true,
                  iconName: "ArrowRight",
                  iconPosition: "only",
                  analyticsId: "journal-primary-cta",
                  style: {
                    backgroundColor: "#111111",
                    textColor: "#FFFFFF",
                    borderRadius: 16,
                  },
                },
              },
            ],
            branchRules: [],
            skipWhen: [],
          },
        ],
        settings: {
          dismissible: true,
          transitionAnimation: "slide",
          screenTransition: {
            type: "spring",
          },
        },
        variables: [
          {
            key: "entry_context",
            type: "STRING",
            defaultValue: "journal",
          },
        ],
      },
    },
  };

  assert.equal(flowConfigSchema.safeParse(response.flow.config).success, true);

  const parsed = sdkFlowResponseSchema.safeParse(response);

  assert.equal(
    parsed.success,
    true,
    parsed.success ? undefined : JSON.stringify(parsed.error.issues, null, 2),
  );
});

test("sdk accepts the newer previous-screen button target", () => {
  const response = {
    flow: {
      slug: "journal-review",
      version: 1,
      config: {
        screens: [
          {
            id: "screen_review",
            name: "Review",
            order: 0,
            components: [
              {
                id: "back_button",
                type: "BUTTON",
                order: 0,
                props: {
                  label: "Back",
                  action: "PREV_SCREEN",
                  actionTarget: "previous",
                },
              },
            ],
          },
        ],
      },
    },
  };

  const parsed = sdkFlowResponseSchema.safeParse(response);

  assert.equal(
    parsed.success,
    true,
    parsed.success ? undefined : JSON.stringify(parsed.error.issues, null, 2),
  );
});
