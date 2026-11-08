# שבצתי

לוח משמרות משפחתי בעברית (RTL), לפי שעון ישראל (`Asia/Jerusalem`). כניסה עם Google בלבד, ורק בהזמנה.

Live: https://shabetzti.apps.grok.bot

## איך הזמנות עובדות

1. כתובות Google ב-`ADMIN_EMAIL` (אחת או יותר, מופרדות בפסיק) הופכות למנהלים בכניסה. מנהל יכול אחר כך להזמין בן משפחה ולהפוך אותו למנהל.
2. המנהל פותח **ניהול** → **יצירת קישור הזמנה** (אפשר לשייך מראש לתורן). הקישור פג אחרי 7 ימים ומשמש פעם אחת.
3. מעתיקים את הקישור (`/invite/...`) ושולחים לבן משפחה.
4. בן המשפחה פותח את הקישור, נכנס עם Google, ומצטרף. בלי הזמנה תקפה אין כניסה ללוח.
5. אחרי הצטרפות לוחצים «זה אני» על התורן המתאים, ואז **המשמרות שלי** מציגות את המשמרות שלו.

אין הרשמה פתוחה.

## Google Cloud — ייצור

ב-[Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. **OAuth consent screen** — External. שם האפליקציה: שבצתי. כל עוד האפליקציה ב-Testing, מוסיפים את המיילים של בני המשפחה כ-Test users.
2. **Create credentials** → **OAuth client ID** → **Web application**.
3. Authorized JavaScript origins: `https://shabetzti.apps.grok.bot`
4. Authorized redirect URIs: `https://shabetzti.apps.grok.bot/api/auth/callback/google`

סודות בטופס של Cursor (לא בצ'אט): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `ADMIN_EMAIL` (כתובת Google אחת או יותר, מופרדות בפסיק).
