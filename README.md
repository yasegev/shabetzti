# שבצתי

לוח משמרות משפחתי בעברית (RTL), לפי שעון ישראל (`Asia/Jerusalem`). כניסה עם Google בלבד, ורק בהזמנה.

## איך הזמנות עובדות

1. המשתמש הראשון שנכנס עם Google הופך למנהל.
2. המנהל פותח **ניהול** → **יצירת קישור הזמנה** (אפשר לשייך מראש לתורן).
3. מעתיקים את הקישור (`/invite/...`) ושולחים לבן משפחה.
4. בן המשפחה פותח את הקישור, נכנס עם Google, ומצטרף. בלי הזמנה תקפה אין כניסה ללוח.
5. אחרי הצטרפות לוחצים «זה אני» על התורן המתאים, ואז **המשמרות שלי** מציגות את המשמרות שלו.

אין הרשמה פתוחה.

## Google Cloud — מה ליצור

ב-[Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. פרויקט (או בחירת פרויקט קיים) → **APIs & Services** → **OAuth consent screen**.
   סוג: External. שם האפליקציה: שבצתי. מוסיפים את המיילים של בני המשפחה כ-Test users כל עוד האפליקציה ב-Testing.
2. **Credentials** → **Create credentials** → **OAuth client ID**.
3. Application type: **Web application**.
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - כתובת האפליקציה המפורסמת ב-Cursor (אחרי Publish, visibility: **public**)
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://127.0.0.1:3000/api/auth/callback/google`
   - `https://<published-host>/api/auth/callback/google`

את Client ID ו-Client Secret **לא** שולחים בצ'אט. מוסיפים ב-Cursor (Secrets / הטופס המאובטח) את השמות:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET` (מחרוזת אקראית ארוכה להצפנת הסשן)

בפרסום בוחרים **public** כדי שהמשפחה תיכנס מהטלפון בלי חשבון Cursor. האפליקציה עצמה נועלת את הגישה ב-Google ובהזמנה.
