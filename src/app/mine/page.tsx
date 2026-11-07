import { auth } from "@/auth";
import { MyShifts } from "@/components/MyShifts";
import { weekStartSunday } from "@/lib/week";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MinePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.pending) {
    redirect(session?.user?.pending ? "/login?error=invite" : "/login");
  }
  return <MyShifts initialWeek={weekStartSunday()} />;
}
