import { ApiError } from "@/lib/api";

export function authErrorMessage(caught: unknown, action: "login" | "register") {
  if (!(caught instanceof ApiError)) return action === "login" ? "Sign-in failed unexpectedly. Please try again." : "Account creation failed unexpectedly. Please try again.";
  if (caught.status === 0) return "The ExoVision API could not be reached. Check your connection and try again.";
  if (caught.status === 429) return caught.retryAfter ? `Too many attempts. Try again in about ${caught.retryAfter} seconds.` : "Too many attempts. Wait briefly and try again.";
  if (action === "login" && caught.status === 401) return "The email address or password is incorrect.";
  if (action === "register" && caught.status === 409) return "An account already exists for this email address. Sign in instead.";
  if (action === "register" && caught.status === 422) return "Check the fields below. Passwords must contain 12 to 128 characters.";
  return action === "login" ? "Sign-in is temporarily unavailable. Please try again." : "Account creation is temporarily unavailable. Please try again.";
}
