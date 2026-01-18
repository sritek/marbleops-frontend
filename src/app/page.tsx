import { redirect } from "next/navigation";

/**
 * Root page - redirects to dashboard or login
 */
export default function HomePage() {
  // For now, redirect to login
  // The protected layout will handle auth check and redirect accordingly
  redirect("/dashboard");
}
