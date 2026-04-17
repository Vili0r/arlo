type Environment = "DEVELOPMENT" | "PRODUCTION";

type FlowStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type PublishedVersion = {
  version: number;
  config: unknown;
};

type ResolvableFlow = {
  slug: string;
  status: FlowStatus;
  developmentVersion: PublishedVersion | null;
  productionVersion: PublishedVersion | null;
};

type HeaderGetter = {
  get(name: string): string | null;
};

export type EntryPointAssignmentSource =
  | "identified-user"
  | "network-fingerprint"
  | "user-agent"
  | "random";

export interface EntryPointSubject {
  key: string | null;
  source: EntryPointAssignmentSource;
}

export interface EntryPointSelection {
  assignment: string; // flow slug of the selected flow
  bucket: number;
  flow: ResolvableFlow;
}

export interface EntryPointVariantInput {
  flow: ResolvableFlow;
  percentage: number;
}

function normalizeVariants(
  variants: EntryPointVariantInput[] | undefined | null
): EntryPointVariantInput[] | null {
  if (!variants || variants.length < 2) {
    return null;
  }

  const sum = variants.reduce((acc, v) => acc + v.percentage, 0);
  if (sum !== 100) {
    return null;
  }

  for (const variant of variants) {
    if (
      typeof variant.percentage !== "number" ||
      Number.isNaN(variant.percentage) ||
      variant.percentage < 1 ||
      variant.percentage > 99
    ) {
      return null;
    }
  }

  return variants;
}

export function resolveEntryPointSubject(headers: HeaderGetter): EntryPointSubject {
  const userId = headers.get("x-arlo-user-id")?.trim();
  if (userId) {
    return {
      key: `user:${userId}`,
      source: "identified-user",
    };
  }

  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = headers.get("user-agent")?.trim();

  if (forwardedFor) {
    return {
      key: `network:${forwardedFor}|${userAgent ?? ""}`,
      source: "network-fingerprint",
    };
  }

  if (userAgent) {
    return {
      key: `ua:${userAgent}`,
      source: "user-agent",
    };
  }

  return {
    key: null,
    source: "random",
  };
}

export function getPublishedVersionForRouting(
  flow: ResolvableFlow,
  environment: Environment
): PublishedVersion | null {
  return environment === "PRODUCTION" ? flow.productionVersion : flow.developmentVersion;
}

export function computeEntryPointBucket(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 100;
}

export function resolveEntryPointSelection(input: {
  entryPointKey: string;
  controlFlow: ResolvableFlow;
  variants?: EntryPointVariantInput[] | null;
  subjectKey?: string | null;
  fallbackBucket?: number;
}): EntryPointSelection {
  const variants = normalizeVariants(input.variants);

  if (!variants) {
    return {
      assignment: input.controlFlow.slug,
      bucket: 0,
      flow: input.controlFlow,
    };
  }

  const bucket =
    input.subjectKey && input.subjectKey.trim().length > 0
      ? computeEntryPointBucket(`${input.entryPointKey}:${input.subjectKey}`)
      : input.fallbackBucket ?? Math.floor(Math.random() * 100);

  // Walk through variants accumulating percentages to find which range the bucket falls into
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.percentage;
    if (bucket < cumulative) {
      return {
        assignment: variant.flow.slug,
        bucket,
        flow: variant.flow,
      };
    }
  }

  // Fallback to the last variant (should not happen if percentages sum to 100)
  const lastVariant = variants[variants.length - 1];
  return {
    assignment: lastVariant.flow.slug,
    bucket,
    flow: lastVariant.flow,
  };
}
