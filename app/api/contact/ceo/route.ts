import { NextRequest, NextResponse } from "next/server";
import { saveCeoMessage } from "@/lib/server-store";
import { sendAdminWhatsApp, ceoMessageAlertText } from "@/lib/whatsapp";
import { sendCeoMessageEmail } from "@/lib/email";

// In-memory rate limiting map: ip -> timestamp[]
const ipRateLimits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5;

  const timestamps = (ipRateLimits.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  ipRateLimits.set(ip, timestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many messages sent recently. Please wait a few minutes before submitting again." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, contact, subject, message, honeypot } = body as {
      name?: unknown;
      contact?: unknown;
      subject?: unknown;
      message?: unknown;
      honeypot?: unknown;
    };

    // Honeypot anti-spam check: if bot filled this hidden field, return success without saving
    if (honeypot) {
      return NextResponse.json({ ok: true });
    }

    // 1. Validate Name
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json(
        { error: "Please enter your name (2 to 100 characters)." },
        { status: 400 }
      );
    }

    // 2. Validate Contact (Phone or Email)
    if (typeof contact !== "string" || contact.trim().length < 5 || contact.trim().length > 120) {
      return NextResponse.json(
        { error: "Please provide valid contact information (mobile number or email)." },
        { status: 400 }
      );
    }

    // 3. Validate Message
    if (typeof message !== "string" || message.trim().length < 10 || message.trim().length > 2500) {
      return NextResponse.json(
        { error: "Please enter your message (minimum 10 characters, maximum 2,500 characters)." },
        { status: 400 }
      );
    }

    // 4. Clean Subject
    const cleanSubject =
      typeof subject === "string" && subject.trim()
        ? subject.trim().slice(0, 150)
        : undefined;

    // 5. Persist securely
    const saved = await saveCeoMessage({
      name: name.trim(),
      contact: contact.trim(),
      subject: cleanSubject,
      message: message.trim(),
    });

    // 6. Send instant Email notification with full content to the CEO
    try {
      void sendCeoMessageEmail({
        id: saved.id,
        name: saved.name,
        contact: saved.contact,
        subject: saved.subject,
        message: saved.message,
        createdAt: saved.createdAt,
      });
    } catch (e) {
      console.warn("[ceo-contact] Email dispatch warning:", e);
    }

    // 7. Fire-and-forget WhatsApp notification to CEO/Admin
    try {
      void sendAdminWhatsApp(
        ceoMessageAlertText({
          name: saved.name,
          contact: saved.contact,
          subject: saved.subject,
          message: saved.message,
        })
      );
    } catch (e) {
      console.warn("[ceo-contact] WhatsApp dispatch warning:", e);
    }

    return NextResponse.json({
      ok: true,
      id: saved.id,
      message: "Your message has been directly submitted to our CEO's desk. We deeply value your feedback and will respond promptly.",
    });
  } catch (error) {
    console.error("[ceo-contact] error processing message:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while delivering your message. Please try again." },
      { status: 500 }
    );
  }
}
