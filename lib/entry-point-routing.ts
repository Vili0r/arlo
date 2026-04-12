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
  assignment: "control" | "variant";
  bucket: number;
  flow: ResolvableFlow;
}

function normalizeVariantPercentage(value: number | null | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (value < 1 || value > 99) {
    return null;
  }

  return Math.round(value);
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
  variantFlow?: ResolvableFlow | null;
  variantPercentage?: number | null;
  subjectKey?: string | null;
  fallbackBucket?: number;
}): EntryPointSelection {
  const percentage = normalizeVariantPercentage(input.variantPercentage);

  if (!input.variantFlow || percentage === null) {
    return {
      assignment: "control",
      bucket: 0,
      flow: input.controlFlow,
    };
  }

  const bucket =
    input.subjectKey && input.subjectKey.trim().length > 0
      ? computeEntryPointBucket(`${input.entryPointKey}:${input.subjectKey}`)
      : input.fallbackBucket ?? Math.floor(Math.random() * 100);

  if (bucket < percentage) {
    return {
      assignment: "variant",
      bucket,
      flow: input.variantFlow,
    };
  }

  return {
    assignment: "control",
    bucket,
    flow: input.controlFlow,
  };
}
