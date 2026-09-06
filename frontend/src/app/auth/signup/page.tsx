import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return <AuthShell eyebrow="Account-scoped research" title="Create your workspace" description="Register with an email address, display name, and password to keep analyses and reports private to your account." alternateHref="/auth/login" alternateLabel="Sign in"><SignupForm /></AuthShell>;
}
