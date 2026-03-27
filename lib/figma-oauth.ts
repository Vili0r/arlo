import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";
import type { Prisma } from "../app/generated/prisma/client";
import prisma from "@/lib/prisma";

const FIGMA_API_BASE_URL = "https://api.figma.com/v1";
const FIGMA_AUTHORIZE_URL = "https://www.figma.com/oauth";
const FIGMA_TOKEN_URL = "https://api.figma.com/v1/oauth/token";
const FIGMA_REFRESH_URL = "https://api.figma.com/v1/oauth/refresh";

export const FIGMA_OAUTH_STATE_COOKIE = "arlo_figma_oauth_state";
const DEFAULT_FIGMA_OAUTH_SCOPES = ["file_content:read"] as const;

type FigmaAuthMode = "oauth" | "token" | "none";

interface FigmaTokenResponse {
  user_id_string?: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface StoredFigmaConnection {
  id: string;
  userId: string;
  figmaUserId: string | null;
  figmaHandle: string | null;
  figmaEmail: string | null;
  figmaAvatarUrl: string | null;
  accessTokenCiphertext: string;
  refreshTokenCiphertext: string;
  tokenType: string;
  expiresAt: Date;
}

interface FigmaMeResponse {
  id?: string;
  handle?: string;
  email?: string;
  img_url?: string;
}

interface OAuthStatePayload {
  state: string;
  userId: string;
  flowId: string;
  createdAt: number;
}

type FigmaConnectionDelegate = {
  upsert: (args: Prisma.FigmaConnectionUpsertArgs) => Promise<unknown>;
  findUnique: (args: Prisma.FigmaConnectionFindUniqueArgs) => Promise<StoredFigmaConnection | null>;
};

function getEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function parseScopeList(value: string | null): string[] | null {
  if (!value) return null;

  const scopes = value
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  if (scopes.length === 0) {
    return null;
  }

  return [...new Set(scopes)];
}

function getFigmaConnectionDelegate(): FigmaConnectionDelegate | null {
  const runtimePrisma = prisma as typeof prisma & {
    figmaConnection?: FigmaConnectionDelegate;
  };

  return runtimePrisma.figmaConnection ?? null;
}

function isMissingFigmaConnectionTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2021"
  );
}

function getClientId(): string | null {
  return getEnv("FIGMA_CLIENT_ID");
}

function getClientSecret(): string | null {
  return getEnv("FIGMA_CLIENT_SECRET") || getEnv("FIGMA_SECRET_TOKEN");
}

function normalizeRedirectUri(input: string): string {
  const url = new URL(input);
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  url.hash = "";
  return url.toString();
}

export function getFigmaRedirectUri(): string | null {
  const raw = getEnv("FIGMA_REDIRECT_URI");
  return raw ? normalizeRedirectUri(raw) : null;
}

export function getFigmaOAuthScopes(): readonly string[] {
  return parseScopeList(getEnv("FIGMA_OAUTH_SCOPES")) ?? DEFAULT_FIGMA_OAUTH_SCOPES;
}

function getFigmaAccessTokenFallback(): string | null {
  return getEnv("FIGMA_ACCESS_TOKEN");
}

export function getFigmaAuthMode(): FigmaAuthMode {
  if (getClientId() && getClientSecret() && getFigmaRedirectUri()) return "oauth";
  if (getFigmaAccessTokenFallback()) return "token";
  return "none";
}

export function isFigmaOAuthEnabled(): boolean {
  return getFigmaAuthMode() === "oauth";
}

function getRequiredOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const redirectUri = getFigmaRedirectUri();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Figma OAuth is not configured. Set FIGMA_CLIENT_ID, FIGMA_CLIENT_SECRET, and FIGMA_REDIRECT_URI.");
  }

  return { clientId, clientSecret, redirectUri };
}

function getSigningKey(): Buffer {
  const secret = getClientSecret() || getFigmaAccessTokenFallback();
  if (!secret) {
    throw new Error("Missing a server secret for Figma OAuth state signing.");
  }
  return createHash("sha256").update(secret).digest();
}

function getEncryptionKey(): Buffer {
  const secret =
    getEnv("FIGMA_TOKEN_ENCRYPTION_KEY") ||
    getClientSecret() ||
    getFigmaAccessTokenFallback();

  if (!secret) {
    throw new Error("Missing a secret for Figma token encryption.");
  }

  return createHash("sha256").update(secret).digest();
}

export function sealSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function unsealSecret(value: string): string {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Invalid encrypted secret.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSigningKey()).update(payload).digest("base64url");
}

export function serializeOAuthStateCookie(payload: OAuthStatePayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseOAuthStateCookie(value: string | undefined): OAuthStatePayload | null {
  if (!value) return null;
  const [payloadPart, signature] = value.split(".");
  if (!payloadPart || !signature) return null;
  if (signPayload(payloadPart) !== signature) return null;

  try {
    return JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as OAuthStatePayload;
  } catch {
    return null;
  }
}

export function createOAuthState(userId: string, flowId: string): OAuthStatePayload {
  return {
    state: randomBytes(24).toString("base64url"),
    userId,
    flowId,
    createdAt: Date.now(),
  };
}

function getBasicAuthHeader(): string {
  const { clientId, clientSecret } = getRequiredOAuthConfig();
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function readFigmaJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { err?: string; error?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.err ||
      payload?.error ||
      payload?.message ||
      `Figma request failed with status ${response.status}.`,
    );
  }

  return payload as T;
}

export function buildFigmaAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getRequiredOAuthConfig();
  const url = new URL(FIGMA_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", getFigmaOAuthScopes().join(" "));
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeCodeForFigmaTokens(code: string): Promise<FigmaTokenResponse> {
  const { redirectUri } = getRequiredOAuthConfig();
  const body = new URLSearchParams({
    redirect_uri: redirectUri,
    code,
    grant_type: "authorization_code",
  });

  const response = await fetch(FIGMA_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  return readFigmaJson<FigmaTokenResponse>(response);
}

async function refreshFigmaTokens(refreshToken: string): Promise<FigmaTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
  });

  const response = await fetch(FIGMA_REFRESH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${getBasicAuthHeader()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  return readFigmaJson<FigmaTokenResponse>(response);
}

export async function fetchFigmaMe(accessToken: string): Promise<FigmaMeResponse | null> {
  const response = await fetch(`${FIGMA_API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as FigmaMeResponse | null;
}

export function buildFigmaApiHeaders(accessToken: string): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export function buildFigmaFallbackHeaders(): HeadersInit {
  const token = getFigmaAccessTokenFallback();
  if (!token) {
    throw new Error("Figma access token fallback is not configured.");
  }
  return {
    "X-Figma-Token": token,
  };
}

export async function upsertFigmaConnection(input: {
  userId: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  figmaUserId?: string | null;
  figmaHandle?: string | null;
  figmaEmail?: string | null;
  figmaAvatarUrl?: string | null;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
  const delegate = getFigmaConnectionDelegate();

  if (!delegate) {
    throw new Error(
      "The Prisma client does not include FigmaConnection yet. Restart the dev server and try again.",
    );
  }

  try {
    await delegate.upsert({
      where: { userId: input.userId },
      update: {
        accessTokenCiphertext: sealSecret(input.accessToken),
        refreshTokenCiphertext: sealSecret(input.refreshToken),
        tokenType: input.tokenType,
        expiresAt,
        figmaUserId: input.figmaUserId ?? undefined,
        figmaHandle: input.figmaHandle ?? undefined,
        figmaEmail: input.figmaEmail ?? undefined,
        figmaAvatarUrl: input.figmaAvatarUrl ?? undefined,
      },
      create: {
        userId: input.userId,
        accessTokenCiphertext: sealSecret(input.accessToken),
        refreshTokenCiphertext: sealSecret(input.refreshToken),
        tokenType: input.tokenType,
        expiresAt,
        figmaUserId: input.figmaUserId ?? null,
        figmaHandle: input.figmaHandle ?? null,
        figmaEmail: input.figmaEmail ?? null,
        figmaAvatarUrl: input.figmaAvatarUrl ?? null,
      },
    });
  } catch (error) {
    if (isMissingFigmaConnectionTableError(error)) {
      throw new Error(
        "The database is missing the figma_connections table. Run `npx prisma db push` (or your migration command) and try again.",
      );
    }

    throw error;
  }
}

export async function getStoredFigmaConnection(userId: string): Promise<StoredFigmaConnection | null> {
  const delegate = getFigmaConnectionDelegate();
  if (!delegate) {
    return null;
  }

  try {
    return await delegate.findUnique({
      where: { userId },
    });
  } catch (error) {
    if (isMissingFigmaConnectionTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getFigmaConnectionStatusForUser(userId: string): Promise<{
  mode: FigmaAuthMode;
  connected: boolean;
  accountLabel: string | null;
  expiresAt: string | null;
}> {
  const mode = getFigmaAuthMode();
  if (mode === "token") {
    return {
      mode,
      connected: true,
      accountLabel: "Server access token",
      expiresAt: null,
    };
  }

  if (mode !== "oauth") {
    return {
      mode,
      connected: false,
      accountLabel: null,
      expiresAt: null,
    };
  }

  const connection = await getStoredFigmaConnection(userId);
  if (!connection) {
    return {
      mode,
      connected: false,
      accountLabel: null,
      expiresAt: null,
    };
  }

  return {
    mode,
    connected: true,
    accountLabel: connection.figmaHandle || connection.figmaEmail || connection.figmaUserId || "Connected",
    expiresAt: connection.expiresAt.toISOString(),
  };
}

export async function getUsableFigmaAccessToken(userId: string): Promise<{
  mode: "oauth" | "token";
  accessToken: string;
}> {
  const mode = getFigmaAuthMode();

  if (mode === "token") {
    const token = getFigmaAccessTokenFallback();
    if (!token) {
      throw new Error("Figma access token fallback is not configured.");
    }

    return {
      mode,
      accessToken: token,
    };
  }

  if (mode !== "oauth") {
    throw new Error("Figma is not configured. Set OAuth credentials or a server access token.");
  }

  const connection = await getStoredFigmaConnection(userId);
  if (!connection) {
    throw new Error("Connect your Figma account before importing.");
  }

  const now = Date.now();
  const refreshThreshold = connection.expiresAt.getTime() - 5 * 60 * 1000;
  if (now < refreshThreshold) {
    return {
      mode,
      accessToken: unsealSecret(connection.accessTokenCiphertext),
    };
  }

  const refreshToken = unsealSecret(connection.refreshTokenCiphertext);
  const refreshed = await refreshFigmaTokens(refreshToken);
  const nextAccessToken = refreshed.access_token;
  const nextRefreshToken = refreshed.refresh_token || refreshToken;

  await upsertFigmaConnection({
    userId,
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    tokenType: refreshed.token_type || connection.tokenType,
    expiresInSeconds: refreshed.expires_in,
    figmaUserId: connection.figmaUserId,
    figmaHandle: connection.figmaHandle,
    figmaEmail: connection.figmaEmail,
    figmaAvatarUrl: connection.figmaAvatarUrl,
  });

  return {
    mode,
    accessToken: nextAccessToken,
  };
}
