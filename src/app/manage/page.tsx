import { safeAuth } from "@/auth";
import { ManagePanel } from "@/components/ManagePanel";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ManagePage() {
  const session = await safeAuth();
  if (!session?.user?.id || session.user.pending) {
    redirect(session?.user?.pending ? "/login?error=invite" : "/login");
  }
  return <ManagePanel />;
}
