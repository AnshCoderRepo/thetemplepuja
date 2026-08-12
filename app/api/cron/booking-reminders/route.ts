import { NextRequest, NextResponse } from "next/server";
import { sendBookingReminders } from "@/lib/reminders";

// Daily job: send every devotee a WhatsApp reminder the day before their pooja
// muhurat. Point a scheduler at this route once per day (Vercel Cron, GitHub
// Actions, Windows Task Scheduler, …). Sends are idempotent per muhurat date,
// so even a double-trigger can't spam a devotee.
//
// Security: when CRON_SECRET is set, the request must carry
// `Authorization: Bearer <CRON_SECRET>`. Without it the route stays open so
// local/dev cron testing works — set CRON_SECRET before deploying.
export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const summary = await sendBookingReminders();
  return NextResponse.json({ ok: true, summary });
}
