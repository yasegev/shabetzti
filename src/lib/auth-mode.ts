export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function isPublishedHost(): boolean {
  return Boolean(process.env.CURSOR_APP_ID || process.env.VERCEL);
}

export function isDevLoginEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (isPublishedHost()) return false;
  return process.env.AUTH_ALLOW_DEV_LOGIN === "true";
}

export const WATCHER_COLORS = [
  "#2f6f4e",
  "#3d5a80",
  "#b0892e",
  "#9b4d6a",
  "#4a6fa5",
  "#6b4f3b",
  "#5c7a5a",
  "#8c4a32",
];
