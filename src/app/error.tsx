"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>שבצתי</h1>
        <p>משהו השתבש בטעינה. נסו שוב.</p>
        <button className="primary" type="button" onClick={() => reset()}>
          נסו שוב
        </button>
        <p>
          <a href="/login">חזרה לכניסה</a>
        </p>
      </div>
    </div>
  );
}
