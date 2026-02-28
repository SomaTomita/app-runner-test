import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-surface-50 dark:bg-surface-950">
          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-surface-100">
              Deploy Comparison App
            </h1>
            <p className="mt-2 text-surface-500 dark:text-surface-400">
              Please sign in to continue.
            </p>
            <SignInButton mode="modal">
              <button className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-primary-700 active:bg-primary-800">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-8 dark:border-surface-800 dark:bg-surface-950/80">
            <h1 className="text-lg font-semibold tracking-tight text-surface-900 dark:text-surface-100">
              Deploy Comparison App
            </h1>
            <UserButton />
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </SignedIn>
    </>
  );
}
