import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">Arlo</span>
          </div>
          <nav className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton>
                <button className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Sign Up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Post-Market Quality Tracker
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Log product complaints, track investigations, and manage CAPAs — built
            for ISO 13485 and FDA 21 CFR Part 11 compliance.
          </p>
          <Show when="signed-out">
            <div className="mt-8 flex items-center justify-center gap-3">
              <SignInButton>
                <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Get Started
                </button>
              </SignInButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="mt-8">
              <p className="text-sm text-muted-foreground">
                You&apos;re signed in. The dashboard is coming soon.
              </p>
            </div>
          </Show>
        </div>
      </main>
    </div>
  );
}
