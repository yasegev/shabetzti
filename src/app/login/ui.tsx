import { GoogleButton } from "./google-button";
import { MockLoginForm } from "./mock-login";

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
          <p className="banner">
            כתובות המנהלים שנקבעו ב-Cursor יכולות לפתוח את המשפחה. אחר כך אפשר להזמין ולהפוך בן משפחה למנהל.
          </p>
        ) : invite ? (
          <p className="banner">הוזמנתם להצטרף למשפחה. היכנסו עם Google כדי לאשר.</p>
        ) : pending ? (
          <p className="banner">החשבון מחובר אבל עדיין לא במשפחה. פתחו קישור הזמנה תקף.</p>
        ) : (
          <p className="hint">אין הרשמה פתוחה. מי שאין לו הזמנה לא יכול להצטרף.</p>
        )}
        {message ? <p className="error">{message}</p> : null}
        {google ? (
          <GoogleButton redirectTo={redirectTo} label="כניסה עם Google" />
        ) : (
          <>
            <p className="hint">כניסת Google האמיתית תופעל אחרי שיוסיפו את הסודות ב-Cursor:</p>
            <p className="hours">GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET · AUTH_SECRET</p>
          </>
        )}
        {dev ? <MockLoginForm invite={invite} redirectTo={redirectTo} /> : null}
        {!google && !dev ? (
          <p className="error">
            עדיין אין פרטי Google. הוסיפו אותם ב-Cursor ואז הכניסה למשפחה תעבוד מהטלפון.
          </p>
        ) : null}
      </div>
    </div>
  );
}
