import { auth } from "@/auth";
import { ManagePanel } from "@/components/ManagePanel";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.pending) {
    redirect(session?.user?.pending ? "/login?error=invite" : "/login");
  }
  return <ManagePanel />;
}
