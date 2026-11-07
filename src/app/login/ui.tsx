import { devSignIn, googleSignIn } from "@/app/auth-actions";

const ERRORS: Record<string, string> = {
  invite: "הגישה בהזמנה בלבד. בקשו מקישור הזמנה ממנהל המשפחה.",
  CredentialsSignin: "לא ניתן להתחבר. בדקו את הפרטים.",
  AccessDenied: "הגישה בהזמנה בלבד.",
  Configuration: "הכניסה עם Google עדיין לא הוגדרה.",
};

export function LoginForm({
  google,
  dev,
  firstUser,
  pending,
  error,
  invite,
  redirectTo,
}: {
  google: boolean;
  dev: boolean;
  firstUser: boolean;
  pending: boolean;
  error: string | null;
  invite: string | null;
  redirectTo: string;
}) {
  const message = error ? ERRORS[error] || "לא ניתן להתחבר." : null;
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>שבצתי</h1>
        <p className="hint">לוח משמרות משפחתי. כניסה עם Google בלבד, ורק בהזמנה.</p>
        {firstUser ? (
          <p className="banner">רק כתובת המנהל שנקבעה ב-Cursor יכולה לפתוח את המשפחה.</p>
        ) : invite ? (
          <p className="banner">הוזמנתם להצטרף למשפחה. היכנסו עם Google כדי לאשר.</p>
        ) : pending ? (
          <p className="banner">החשבון מחובר אבל עדיין לא במשפחה. פתחו קישור הזמנה תקף.</p>
        ) : (
          <p className="hint">אין הרשמה פתוחה. מי שאין לו הזמנה לא יכול להצטרף.</p>
        )}
        {message ? <p className="error">{message}</p> : null}
        {google ? (
          <form action={googleSignIn}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button className="soft" type="submit">
              כניסה עם Google
            </button>
          </form>
        ) : (
          <>
            <p className="hint">כניסת Google האמיתית תופעל אחרי שיוסיפו את הסודות ב-Cursor:</p>
            <p className="hours">GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET · AUTH_SECRET</p>
          </>
        )}
        {dev ? (
          <form action={devSignIn}>
            <p className="banner">מצב מקומי: כניסת Google מדומה לצורך בדיקה (נתוני דוגמה).</p>
            <input type="hidden" name="invite" value={invite ?? ""} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input name="name" placeholder="שם" required />
            <input name="email" type="email" placeholder="אימייל" required />
            <button className="primary" type="submit">
              כניסה מדומה
            </button>
          </form>
        ) : null}
        {!google && !dev ? (
          <p className="error">
            עדיין אין פרטי Google. הוסיפו אותם ב-Cursor ואז הכניסה למשפחה תעבוד מהטלפון.
          </p>
        ) : null}
      </div>
    </div>
  );
}
