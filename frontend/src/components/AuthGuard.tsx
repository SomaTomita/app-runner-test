import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import type { ReactNode } from "react";

const styles = {
  signedOut: { textAlign: "center", marginTop: "4rem" } as const,
  signInBtn: {
    padding: "0.5rem 1.5rem",
    fontSize: "1rem",
    cursor: "pointer",
  } as const,
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    borderBottom: "1px solid #ddd",
  } as const,
  title: { margin: 0, fontSize: "1.2rem" } as const,
  main: { padding: "1rem" } as const,
};

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <>
      <SignedOut>
        <div style={styles.signedOut}>
          <h1>Deploy Comparison App</h1>
          <p>Please sign in to continue.</p>
          <SignInButton mode="modal">
            <button style={styles.signInBtn}>Sign In</button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <header style={styles.header}>
          <h1 style={styles.title}>Deploy Comparison App</h1>
          <UserButton />
        </header>
        <main style={styles.main}>{children}</main>
      </SignedIn>
    </>
  );
}
