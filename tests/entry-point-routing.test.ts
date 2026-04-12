import assert from "node:assert/strict";
import test from "node:test";

import {
  computeEntryPointBucket,
  resolveEntryPointSelection,
  resolveEntryPointSubject,
} from "../lib/entry-point-routing";

const controlFlow = {
  slug: "welcome-control",
  status: "PUBLISHED" as const,
  developmentVersion: {
    version: 2,
    config: {},
  },
  productionVersion: {
    version: 1,
    config: {},
  },
};

const variantFlow = {
  slug: "welcome-variant",
  status: "PUBLISHED" as const,
  developmentVersion: {
    version: 4,
    config: {},
  },
  productionVersion: {
    version: 3,
    config: {},
  },
};

test("entry point buckets are stable and bounded", () => {
  const bucket = computeEntryPointBucket("onboarding_home:user:user_123");

  assert.equal(bucket, computeEntryPointBucket("onboarding_home:user:user_123"));
  assert.equal(bucket >= 0 && bucket < 100, true);
});

test("variant assignment uses the configured percentage and subject key", () => {
  const selection = resolveEntryPointSelection({
    entryPointKey: "onboarding_home",
    controlFlow,
    variantFlow,
    variantPercentage: 50,
    subjectKey: "user:user_123",
  });

  assert.equal(selection.assignment, "variant");
  assert.equal(selection.flow.slug, "welcome-variant");
});

test("control flow is used when the bucket misses the variant percentage", () => {
  const selection = resolveEntryPointSelection({
    entryPointKey: "onboarding_home",
    controlFlow,
    variantFlow,
    variantPercentage: 20,
    fallbackBucket: 87,
  });

  assert.equal(selection.assignment, "control");
  assert.equal(selection.flow.slug, "welcome-control");
});

test("split tests fall back to control when variant config is incomplete", () => {
  const selection = resolveEntryPointSelection({
    entryPointKey: "onboarding_home",
    controlFlow,
    variantPercentage: 50,
    subjectKey: "user:user_123",
  });

  assert.equal(selection.assignment, "control");
  assert.equal(selection.flow.slug, "welcome-control");
});

test("subject resolution prefers identified users over network hints", () => {
  const subject = resolveEntryPointSubject({
    get(name: string) {
      if (name === "x-arlo-user-id") {
        return "user_123";
      }

      if (name === "x-forwarded-for") {
        return "203.0.113.1";
      }

      if (name === "user-agent") {
        return "ArloTest/1.0";
      }

      return null;
    },
  });

  assert.deepEqual(subject, {
    key: "user:user_123",
    source: "identified-user",
  });
});
