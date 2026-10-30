// Prisma's migration engine accepts require/strict rather than node-postgres's
// verify-full mode. Preserve the CA path and enforce certificate verification.
export function migrationDatabaseUrl(value: string): string {
  if (!value) return value;
  const url = new URL(value);
  if (url.searchParams.get("sslmode") === "verify-full") {
    url.searchParams.set("sslmode", "require");
    url.searchParams.set("sslaccept", "strict");
  }
  return url.toString();
}
