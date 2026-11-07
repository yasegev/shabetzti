# שבצתי

לוח משמרות משפחתי בעברית (RTL), לפי שעון ישראל (`Asia/Jerusalem`). כניסה עם Google בלבד, ורק בהזמנה.

Live: https://shabetzti.apps.grok.bot

## איך הזמנות עובדות

1. המשתמש הראשון שנכנס עם Google הופך למנהל.
2. המנהל פותח **ניהול** → **יצירת קישור הזמנה** (אפשר לשייך מראש לתורן).
3. מעתיקים את הקישור (`/invite/...`) ושולחים לבן משפחה.
4. בן המשפחה פותח את הקישור, נכנס עם Google, ומצטרף. בלי הזמנה תקפה אין כניסה ללוח.
5. אחרי הצטרפות לוחצים «זה אני» על התורן המתאים, ואז **המשמרות שלי** מציגות את המשמרות שלו.

אין הרשמה פתוחה.

## Google Cloud — מה ליצור (ייצור בלבד)

ב-[Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. **OAuth consent screen** — External. שם האפליקציה: שבצתי. כל עוד האפליקציה ב-Testing, מוסיפים את המיילים של בני המשפחה כ-Test users.
2. **Create credentials** → **OAuth client ID** → **Web application**.
3. Authorized JavaScript origins — רק:
   - `https://shabetzti.apps.grok.bot`
4. Authorized redirect URIs — רק:
   - `https://shabetzti.apps.grok.bot/api/auth/callback/google`

את Client ID, Client Secret ו-AUTH_SECRET **לא** שולחים בצ'אט. מוסיפים בטופס הסודות של Cursor:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET` (מחרוזת אקראית ארוכה)

ב-Publish Settings בוחרים **public** כדי שטלפונים של המשפחה (ו-Google callback) יגיעו לאפליקציה בלי חשבון Cursor.
