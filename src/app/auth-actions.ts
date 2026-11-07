"use server";

import { signIn, signOut } from "@/auth";
import { googleConfigured, isDevLoginEnabled } from "@/lib/auth-mode";
import { redirect } from "next/navigation";

export async function googleSignIn(formData: FormData) {
  if (!googleConfigured()) {
    redirect("/login?error=Configuration");
  }
  const redirectTo = String(formData.get("redirectTo") || "/");
  await signIn("google", { redirectTo });
}

export async function devSignIn(formData: FormData) {
  if (!isDevLoginEnabled()) {
    redirect("/login?error=Configuration");
  }
  const redirectTo = String(formData.get("redirectTo") || "/");
  await signIn("dev-google", {
    name: String(formData.get("name") || ""),
    email: String(formData.get("email") || ""),
    invite: String(formData.get("invite") || ""),
    redirectTo,
  });
}

export async function doSignOut() {
  await signOut({ redirectTo: "/login" });
}
