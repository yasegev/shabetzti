export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function isDevLoginEnabled(): boolean {
  if (googleConfigured()) return false;
  if (process.env.AUTH_ALLOW_DEV_LOGIN === "true") return true;
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export function authSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    "dev-only-shabetzti-auth-secret"
  );
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
