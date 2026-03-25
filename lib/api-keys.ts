import { createHash, randomBytes } from "crypto";

export type ApiKeyEnvironment = "DEVELOPMENT" | "PRODUCTION";

export interface GeneratedApiKey {
  rawKey: string;
  hashedKey: string;
  prefix: string;
}

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey(environment: ApiKeyEnvironment): GeneratedApiKey {
  const envPrefix = environment === "PRODUCTION" ? "ob_live_" : "ob_test_";
  const random = randomBytes(24).toString("base64url");
  const rawKey = envPrefix + random;
  const prefix = rawKey.slice(0, envPrefix.length + 6);

  return {
    rawKey,
    hashedKey: hashApiKey(rawKey),
    prefix,
  };
}
