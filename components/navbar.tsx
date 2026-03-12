"use client"

import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export function Navbar() {
  const {user} = useUser();
  return (
    <nav className="w-full flex items-center justify-between px-6 md:px-12 h-[var(--navbar-height)]">
      <Link 
        href="/" 
        className="text-2xl font-bold tracking-tight text-foreground transition-colors hover:text-foreground/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
      >
        arlo.
      </Link>
      
      <div className="flex items-center gap-4">
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={buttonVariants({ variant: "default", className: "rounded-full px-6 transition-transform hover:scale-105 active:scale-95 shadow-soft hover:shadow-soft-md" })}>Dashboard</Link>
            <UserButton />
            {user?.firstName && <p>{user.firstName}</p>}
          </div>
        </Show>
      </div>
    </nav>
  );
}
