import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <AuthShell eyebrow="Secure research workspace" title="Sign in to ExoVision" description="Continue to your owned observation analyses, candidate-screening results, and scientific reports." alternateHref="/auth/signup" alternateLabel="Create an account"><LoginForm /></AuthShell>;
}
