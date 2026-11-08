"use client";

import { useEffect, useState } from "react";

export function GoogleButton({
  redirectTo,
  label,
}: {
  redirectTo: string;
  label: string;
}) {
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    void fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" })
      .then((res) => res.json())
      .then((data: { csrfToken?: string }) => setCsrf(data.csrfToken ?? ""))
      .catch(() => setCsrf(""));
  }, []);

  return (
    <form method="POST" action="/api/auth/signin/google">
      <input type="hidden" name="csrfToken" value={csrf} />
      <input type="hidden" name="callbackUrl" value={redirectTo} />
      <button className="soft" type="submit" disabled={!csrf}>
        {label}
      </button>
    </form>
  );
}
