# The Temple Puja — Platform Handover Document

**Prepared for:** Client  
**Product:** The Temple Puja — India's digital spiritual platform for booking certified pandits and sacred poojas online  
**Contact:**

---

## 1. What This Platform Does

The Temple Puja is a complete online pooja-booking platform. Visitors choose a sacred ritual (or a live group-event slot), share their details and the intention behind the pooja (sankalp), pay securely, and receive an instant booking confirmation. Every payment automatically creates a personal devotee profile, and the **admin panel** gives the owner full control over every pooja, event, coupon and devotee — all synced across devices in real time.

The site is fully live end-to-end: **home page → booking → payment → confirmation → devotee profile → admin dashboard** — and the same flows work on mobile and desktop.

---

## 2. Pages & Visitor Experience

| Page | What it does |
|---|---|
| **Home (`/`)** | Hero with trust stats, **Live & Upcoming events** (a draggable cover-flow carousel with LIVE badges, muhurat date/time and live seat counts), Why Choose Us, Exclusive Offers (coupons), Devotee Reviews, FAQ, Contact, and a floating **AI Spiritual Guide** chatbot. |
| **Book Pooja (`/book`)** | Full pooja catalogue — 12 sacred rituals with prices, duration, benefits and descriptions. |
| **Booking Form (`/book/form`)** | The complete booking flow: choose prayer → enter **name, gotra, city, mobile number, and the reason you want the pooja** → optional coupon → secure payment → instant confirmation. |
| **Pooja Detail (`/book/[pooja]`)** | Each pooja has its own booking page with a fixed muhurat when booked from a live-event slot. |
| **Login (`/login`)** | One sign-in for everyone: devotees log in with their **10-digit mobile number** (no password needed — the number is their ID), admins with **email + password**. |
| **Signup (`/signup`)** | Pre-fill your details (name, gotra, city, mobile) before your first booking. |
| **My Profile (`/profile`)** | View your details and full pooja history from any device — with **Cancel Booking** and **Reschedule to a new muhurat** actions. |
| **Booking Receipt (`/booking/[bookingId]`)** | A private receipt for any booking — the booking id (e.g. `SKX7Q2LM`) **plus the mobile number used at booking** unlocks the pooja, muhurat, holder, payment summary and status; any mismatch shows a generic "not found" so ids can't be probed. Links from the confirmation screen and profile bookings carry the phone automatically. A **Print / Save as PDF** button (with dedicated print styling) turns it into a clean, client-ready receipt document. |
| **Admin Dashboard (`/admin`)** | The owner's control room (details in section 4). |

---

## 3. The Booking Flow (as it works today)

1. **Choose a pooja** — from the catalogue or a live-event slot (event slots carry a fixed date & time and hold a seat against the event's capacity).
2. **Fill the booking form** — full name, gotra, city, 10-digit mobile, and a short note on **why you want this pooja** (the pandit keeps this sankalp in mind during the ritual).
3. **Apply a coupon** (optional) — discounts validate instantly (see section 5).
4. **Pay securely** — a Razorpay-style checkout with **UPI, Card, Netbanking and Wallet** tabs, backed by Razorpay's real Orders API when payment keys are configured (see section 8 for the current mode).
5. **Get your booking ID** — an instant confirmation screen (e.g. `SKX7Q2LM`) with a full payment summary, a "Confirm on WhatsApp" button, a **View Receipt** link, and a link straight to your profile.
6. **Your profile is created automatically** — the first payment creates a devotee profile that appears in the admin dashboard instantly, on every device.

---

## 4. Admin Dashboard

Sign in at **/admin** with the admin email + password (credentials in section 9).

### Devotees tab
- Live stats: **total devotees, active bookings, revenue from active bookings, cancelled/refunded count**.
- Every devotee's profile (gotra, city, mobile, email) and complete booking history with status pills (**Confirmed / Rescheduled / Cancelled / Refunded**).
- Actions: **Mark a booking as Refunded**, **Delete a devotee profile**, and **Export all data as JSON**.

### Poojas tab
- **Add, edit or delete poojas** — slug, title, Hindi title, emoji, gradient tile, price, duration, best muhurat, description and benefits.
- **Activate / Deactivate toggle** — deactivate a pooja and it disappears from the whole site (booking form, catalogue, detail pages) without deleting it; edit the muhurat and activate it again whenever you like — no need to recreate it. Changes apply instantly to every visitor.

### Events tab
- Manage the **live-event schedule** shown on the home page. Past events disappear automatically; every event card shows **live remaining-seat counts** that update as bookings and cancellations happen.

### Coupons tab
- **Create and edit coupon codes** (percentage discounts or free benefits, first-booking rules, minimum booking counts, minimum pooja price). Coupons appear on the booking form and the Deals section instantly.

### Account tab
- **Change the admin email and password** — credentials are stored hashed on the server, never hardcoded. Reset to the demo credentials anytime.



## 6. Live Events

- A draggable **cover-flow carousel** on the home page with LIVE badges, event emoji, muhurat (date · time) stamped on each tile, and **live seat availability** ("20 of 20 seats left", "Fully booked").
- **Book Slot** for the pooja in the centre of the carousel — the date and time are fixed by the event, and the booking **holds a seat** against the event's capacity.
- **Auto seat release** — when a devotee cancels (or reschedules away), the seat is freed automatically; a fully-booked event stops taking new bookings.
- Only **upcoming** events are shown — past dates never appear.

---

## 7. Devotee Profiles & Bookings

- **One profile per devotee**, keyed by mobile number — a second booking from the same number appends to the same profile (never a duplicate).
- Profiles and bookings are stored in **MongoDB Atlas** (cloud database), so the admin dashboard and the devotee's profile reflect the same data **on every device, in real time**.
- **Cancel Booking** — status flips to Cancelled, the reason is recorded, the event seat is released, and the admin is notified (refund note shown to the devotee).
- **Reschedule** — pick a new date and time; the booking moves, the status shows **Rescheduled**, and the audit trail records where it moved from.
- **Day-before WhatsApp reminder** — a daily job (see below) messages every devotee the day before their pooja muhurat, with the date, time, booking id and a receipt link. Each booking is reminded **once per muhurat**, so double-triggering the job can never spam.

### Daily booking-reminder job

Call **`GET/POST /api/cron/booking-reminders`** once per day and it finds every confirmed/rescheduled booking whose muhurat is tomorrow and sends the devotee a WhatsApp reminder. It's idempotent: a booking is stamped as reminded only after its message is actually sent, and re-runs skip already-reminded bookings — so the job is safe to retry and can even run a few times a day.

Schedule it with any tool that can hit a URL on a timer — **Vercel Cron** (`vercel.json`), **GitHub Actions**, or a Windows Task Scheduler / cron entry on your server. Secure it by setting `CRON_SECRET` (see section 10): requests must then carry `Authorization: Bearer <CRON_SECRET>`. The reminder link needs `SITE_URL` set in production to point at the real domain.

---

## 8. Payments

The checkout is a Razorpay-style payment page with **UPI, Card, Netbanking and Wallet** options and validation for each (UPI ID format, card number/expiry/CVV, bank/wallet selection).

**Real Razorpay integration is fully built in** — when the Razorpay keys are added (see section 10), the flow becomes:
1. Server creates a Razorpay **order** at a price computed server-side from the catalogue (clients can't tamper with amounts).
2. The browser opens Razorpay's hosted secure checkout.
3. The server **verifies the payment signature** (HMAC) and that the paid amount matches the booking before confirming it.
4. The verified **payment ID is stored on the booking** for reconciliation.

**Current mode:** until the Razorpay keys are provided, the checkout runs in **demo mode** — the flow is identical but payment is simulated so the site can be demonstrated end-to-end.

---

## 9. Admin & Demo Credentials

| Role | Login |
|---|---|
| **Admin** (site owner) | Email `admin@thetemplepuja.com` · Password `admin123` (changeable in the Account tab) |
| **Demo devotees** | 4 sample profiles (Aarav Sharma, Rohan Verma, Meera Joshi, Coupon Test User) ship in the dashboard so it never looks empty |

---

## 10. Configuration (for the development team)

All configuration lives in `.env.local`:

| Variable | Purpose | Status |
|---|---|---|
| `MONGODB_URI` / `MONGODB_DB` | MongoDB Atlas connection (database `templepuja`) | ✅ Configured |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Enables **real** Razorpay checkout (orders + signature verification) | ⏳ Placeholder — add to go live |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` / `ADMIN_WHATSAPP_TO` | Real-time **WhatsApp messages**: an alert to the admin **and a confirmation to the devotee** on every booking confirmation/cancellation (admin defaults to +91 87653 01563) | ⏳ Placeholder — add to enable |
| `SITE_URL` | Public origin used for the receipt link inside the devotee's WhatsApp messages — confirmation and the day-before reminder (falls back to the request's Host header in dev) | ⏳ Optional — set in production |
| `CRON_SECRET` | Bearer token required by the `/api/cron/booking-reminders` job (no auth when unset — dev convenience) | ⏳ Optional — set before deploy |

The site runs with any subset of these: everything degrades gracefully (demo checkout, no WhatsApp, and if Atlas is unreachable the server falls back to local storage so the site never goes down).

---

## 11. Security & Reliability

- **Admin auth:** passwords hashed with **bcrypt**, **rate-limited login** (5 failed attempts → 15-minute lockout), 7-day session tokens, changeable credentials.
- **Server-side truth:** catalog, pricing, coupon validation, payment verification and all profile/booking writes happen on the server.
- **Concurrency-safe:** each devotee has their own database document with a unique phone index — two bookings on different devices never overwrite each other, and duplicate submits never double-create.
- **Payment integrity:** amounts are priced server-side; the payment signature and paid amount are verified before a booking is confirmed; a failed verification is surfaced honestly (no fake confirmations).
- **No hardcoded secrets:** credentials are read from environment variables.

---

## 12. Technology Stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS, custom fonts (Playfair Display, Poppins, Noto Sans Devanagari)
- **Database:** MongoDB Atlas (cloud), with automatic local fallbacks
- **Payments:** Razorpay Orders API (built in)
- **Messaging:** Twilio WhatsApp API (built in)
- **Testing:** 156 automated tests (payment signature vectors, coupon rules, booking/cancel/reschedule flows, concurrency, admin auth, DNS fallback) — `npm test`; typecheck and production build pass.

---

## 13. Running the Project Locally

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:3000
```

```bash
npm run typecheck  # TypeScript check
npm test           # full test suite (156 tests)
npm run build      # production build
```

---

## 14. What's Ready vs. What Needs Your Input

**Live and working today:** the entire visitor journey (home, catalogue, booking, coupon, checkout, confirmation), devotee profiles with cancel/reschedule, the full admin dashboard (poojas, events, coupons, devotees, account), MongoDB cloud sync, and 182 automated tests.

**One step from going live (needs credentials from you):**
1. **Razorpay keys** → switches the checkout from demo mode to real money.
2. **Twilio WhatsApp** → switches messaging from "ready but silent" to real WhatsApp messages: an alert to the admin **and a confirmation to the devotee** (with a tappable receipt link) on every booking.

**Ideas queued for future phases** (not yet built): real-time video streaming of live poojas, email confirmations to devotees, Hindi/English language toggle, and analytics charts in the admin dashboard.
