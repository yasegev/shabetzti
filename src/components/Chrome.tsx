"use client";

import { doSignOut } from "@/app/auth-actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Member } from "@/lib/types";

export function Chrome({
  me,
  authMode,
  children,
  banner,
}: {
  me: Member;
  authMode: "google" | "local-mock";
  children: ReactNode;
  banner?: string;
}) {
  const path = usePathname();
  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <h1>שבצתי</h1>
          <p>לוח משמרות משפחתי לטיפול בבית</p>
        </div>
        <div className="nav">
          <nav className="nav-pills">
            <Link className={path === "/" ? "active" : ""} href="/">
              לוח שבועי
            </Link>
            <Link className={path === "/mine" ? "active" : ""} href="/mine">
              המשמרות שלי
            </Link>
            <Link className={path === "/manage" ? "active" : ""} href="/manage">
              ניהול
            </Link>
          </nav>
          <div className="who">
            {me.isAdmin ? <span className="badge">מנהל</span> : null}
            <span>{me.name || me.email}</span>
            <form action={doSignOut}>
              <button className="ghost" type="submit">
                יציאה
              </button>
            </form>
          </div>
        </div>
      </header>
      {authMode === "local-mock" ? (
        <div className="banner">
          תצוגה מקומית עם כניסת Google מדומה — זו לא התחברות אמיתית ל-Google.
        </div>
      ) : null}
      {banner ? <div className="banner">{banner}</div> : null}
      {children}
    </div>
  );
}
