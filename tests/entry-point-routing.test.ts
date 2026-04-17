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
    variants: [
      { flow: variantFlow, percentage: 50 },
      { flow: controlFlow, percentage: 50 },
    ],
    subjectKey: "user:user_123",
  });

  // onboarding_home:user:user_123 hashes to a bucket that falls in the first half
  assert.equal(selection.assignment, "welcome-variant");
  assert.equal(selection.flow.slug, "welcome-variant");
});

test("control flow is used when the bucket falls into its variant range", () => {
  const selection = resolveEntryPointSelection({
    entryPointKey: "onboarding_home",
    controlFlow,
    variants: [
      { flow: controlFlow, percentage: 80 },
      { flow: variantFlow, percentage: 20 },
    ],
    fallbackBucket: 10,
  });

  assert.equal(selection.assignment, "welcome-control");
  assert.equal(selection.flow.slug, "welcome-control");
});

test("3-way split routes correctly based on bucket ranges", () => {
  const flows = [
    { ...controlFlow, slug: "flow-a" },
    { ...controlFlow, slug: "flow-b" },
    { ...controlFlow, slug: "flow-c" },
  ];

  const variants = [
    { flow: flows[0], percentage: 30 },
    { flow: flows[1], percentage: 30 },
    { flow: flows[2], percentage: 40 },
  ];

  // Bucket 25 -> Flow A
  const s1 = resolveEntryPointSelection({
    entryPointKey: "test",
    controlFlow: flows[0],
    variants,
    fallbackBucket: 25,
  });
  assert.equal(s1.assignment, "flow-a");

  // Bucket 45 -> Flow B (30 + 15)
  const s2 = resolveEntryPointSelection({
    entryPointKey: "test",
    controlFlow: flows[0],
    variants,
    fallbackBucket: 45,
  });
  assert.equal(s2.assignment, "flow-b");

  // Bucket 85 -> Flow C (30 + 30 + 25)
  const s3 = resolveEntryPointSelection({
    entryPointKey: "test",
    controlFlow: flows[0],
    variants,
    fallbackBucket: 85,
  });
  assert.equal(s3.assignment, "flow-c");
});

test("split tests fall back to control when variants total is not 100", () => {
  const selection = resolveEntryPointSelection({
    entryPointKey: "onboarding_home",
    controlFlow,
    variants: [
      { flow: variantFlow, percentage: 50 },
    ],
    subjectKey: "user:user_123",
  });

  assert.equal(selection.assignment, "welcome-control");
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
