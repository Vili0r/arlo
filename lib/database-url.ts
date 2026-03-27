const SSL_MODE_ALIASES = new Set(["prefer", "require", "verify-ca"]);

export function normalizePostgresConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode")?.toLowerCase();
    const usesLibpqCompat = url.searchParams.get("uselibpqcompat")?.toLowerCase() === "true";

    if (!sslmode || usesLibpqCompat || !SSL_MODE_ALIASES.has(sslmode)) {
      return connectionString;
    }

    url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  } catch {
    return connectionString;
  }
}
