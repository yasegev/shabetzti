"use client";

import { useEffect, useState } from "react";

export function MockLoginForm({
  invite,
  redirectTo,
}: {
  invite: string | null;
  redirectTo: string;
}) {
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    void fetch("/api/auth/csrf", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: { csrfToken?: string }) => setCsrf(data.csrfToken ?? ""))
      .catch(() => setCsrf(""));
  }, []);

  return (
    <form method="POST" action="/api/auth/callback/dev-google">
      <p className="banner">מצב מקומי: כניסת Google מדומה לצורך בדיקה (נתוני דוגמה).</p>
      <input type="hidden" name="csrfToken" value={csrf} />
      <input type="hidden" name="callbackUrl" value={redirectTo} />
      <input type="hidden" name="invite" value={invite ?? ""} />
      <input name="name" placeholder="שם" required autoComplete="off" />
      <input name="email" type="email" placeholder="אימייל" required autoComplete="off" />
      <button className="primary" type="submit" disabled={!csrf}>
        כניסה מדומה
      </button>
    </form>
  );
}
