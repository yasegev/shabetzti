import { safeAuth } from "@/auth";
import { WeeklyBoard } from "@/components/WeeklyBoard";
import { weekStartSunday } from "@/lib/week";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const session = await safeAuth();
  if (!session?.user?.id || session.user.pending) {
    redirect(session?.user?.pending ? "/login?error=invite" : "/login");
  }
  return <WeeklyBoard initialWeek={weekStartSunday()} />;
}
