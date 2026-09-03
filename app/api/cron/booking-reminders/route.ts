import { NextRequest, NextResponse } from "next/server";
import { sendBookingReminders } from "@/lib/reminders";

// Daily job: send every devotee a WhatsApp reminder the day before their pooja
// muhurat. Point a scheduler at this route once per day (Vercel Cron, GitHub
// Actions, Windows Task Scheduler, …). Sends are idempotent per muhurat date,
// so even a double-trigger can't spam a devotee.
//
// Daily job: send every devotee a WhatsApp reminder the day before their pooja
// muhurat. Point a scheduler at this route once per day (Vercel Cron, GitHub
// Actions, Windows Task Scheduler, …). Sends are idempotent per muhurat date,
// so even a double-trigger can't spam a devotee.
//
// Security (two layers):
//  1. middleware.ts blocks this route entirely when CRON_SECRET is not set
//     or the Bearer token is missing/wrong.
//  2. The handler below double-checks — defense in depth.
export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail-closed: refuse to run when CRON_SECRET is not configured.
    // Middleware should already block this, but defense-in-depth.
    return NextResponse.json(
      { error: "Cron endpoint not configured." },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await sendBookingReminders();
  return NextResponse.json({ ok: true, summary });
}
