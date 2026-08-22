import { SignUp } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <SignUp />
    </div>
  );
}
