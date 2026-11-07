"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <main style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
          <h1>שבצתי</h1>
          <p>משהו השתבש בטעינה. נסו שוב.</p>
          <button type="button" onClick={() => reset()}>
            נסו שוב
          </button>
        </main>
      </body>
    </html>
  );
}
