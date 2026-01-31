import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <>
      <SignedOut>
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
          <h1>Deploy Comparison App</h1>
          <p>Please sign in to continue.</p>
          <SignInButton mode="modal">
            <button
              style={{
                padding: "0.5rem 1.5rem",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem",
            borderBottom: "1px solid #ddd",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.2rem" }}>
            Deploy Comparison App
          </h1>
          <UserButton />
        </header>
        <main style={{ padding: "1rem" }}>{children}</main>
      </SignedIn>
    </>
  );
}
