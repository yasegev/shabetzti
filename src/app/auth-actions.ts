"use server";

import { signIn, signOut } from "@/auth";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import { redirect } from "next/navigation";

function rethrowRedirect(error: unknown): void {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  ) {
    throw error;
  }
}

export async function googleSignIn(formData: FormData) {
  if (!googleConfigured()) {
    redirect("/login?error=Configuration");
  }
  const redirectTo = String(formData.get("redirectTo") || "/");
  try {
    await signIn("google", { redirectTo });
  } catch (error) {
    rethrowRedirect(error);
    console.error("[shabetzti:googleSignIn]", error instanceof Error ? error.name : "error");
    redirect("/login?error=Configuration");
  }
}

export async function devSignIn(formData: FormData) {
  if (!isDevLoginEnabled()) {
    redirect("/login?error=Configuration");
  }
  const redirectTo = String(formData.get("redirectTo") || "/");
  try {
    await signIn("dev-google", {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      invite: String(formData.get("invite") || ""),
      redirectTo,
    });
  } catch (error) {
    rethrowRedirect(error);
    console.error("[shabetzti:devSignIn]", error instanceof Error ? error.name : "error");
    redirect("/login?error=Configuration");
  }
}

export async function doSignOut() {
  await signOut({ redirectTo: "/login" });
}
