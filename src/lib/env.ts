/** Dynamic process.env reads so Next.js cannot inline empty values at build. */
export function runtimeEnv(name: string): string {
  return String(process.env[name] ?? "").trim();
}
