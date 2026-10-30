import { describe, expect, it } from "vitest";
import { migrationDatabaseUrl } from "./database-url";

describe("migration TLS configuration", () => {
  it("translates verified TLS to the migration engine's strict mode without losing the CA", () => {
    const url = new URL(
      migrationDatabaseUrl(
        "postgresql://example:p%40ss@db.example.com/app?sslmode=verify-full&sslrootcert=/certs/ca.crt",
      ),
    );
    expect(url.searchParams.get("sslmode")).toBe("require");
    expect(url.searchParams.get("sslaccept")).toBe("strict");
    expect(url.searchParams.get("sslrootcert")).toBe("/certs/ca.crt");
    expect(url.password).toBe("p%40ss");
  });

  it("preserves an explicitly configured local plaintext URL", () => {
    const input = "postgresql://example:local@localhost:5432/app";
    expect(migrationDatabaseUrl(input)).toBe(input);
  });

  it("allows generation without a database URL", () => {
    expect(migrationDatabaseUrl("")).toBe("");
  });
});
