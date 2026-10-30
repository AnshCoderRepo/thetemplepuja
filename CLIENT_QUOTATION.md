# 🕉️ PROJECT QUOTATION & SCOPE OF WORK (SOW)

**Document Reference:** `QT-TPS-2026-001`  
**Date:** October 28, 2026  
**Project Title:** **TemplePujaSewa — Comprehensive Vedic Puja & Temple Seva Digital Platform**  
**Technology Architecture:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Dual-Mode Storage (MongoDB Atlas + Fallback Store), Razorpay Gateway, Dynamic UPI QR Engine  
**Project Readiness:** 100% Core Built & Verified (557 Automated Tests Passing)  

---

## 1. Executive Summary

This quotation details the complete design, engineering, multi-language support, payment infrastructure, and administrative tooling delivered for **TemplePujaSewa**. 

The platform has been built from the ground up as a high-performance, secure, and sacred Indian devotional e-commerce and temple booking ecosystem. Devotees worldwide can discover consecrated temples, select auspicious Vedic rituals, enter their Gotra and Sankalp prayers, book tiered puja packages, pay securely via UPI QR or Razorpay, and access their digital tax invoice receipts and ritual video recordings.

The platform includes a dedicated **18-module Admin Control Suite** providing complete autonomy over pujas, muhurats, coupons, bookings, refunds, devotee records, and content management without requiring developer intervention.

---

## 2. Itemized Deliverables & Delivered Features

### Module 1: Sacred Public Portal & Brand Experience
*High-converting, sacred devotional aesthetics aligned with traditional Hindu temple heritage.*

- **Sacred UI/UX Design System**: Custom devotional theme with saffron, warm amber, sacred maroon, and gold palettes, fully responsive across mobile, tablet, and desktop.
- **Dynamic Homepage**:
  - Hero section featuring consecrated deity visuals, live booking ticker, and quick booking triggers.
  - Upcoming Festivals & Auspicious Muhurat countdown calendar.
  - Interactive "Why Choose Us" trust markers (100% certified Vedic Pandits, genuine Samagri, live Sankalp proof).
  - Devotee reviews and verified testimonials carousel.
  - Interactive FAQ accordion for ritual and booking clarity.
  - Direct "Message to CEO / Leadership Desk" contact form with automated email dispatch.
- **Multi-Language Architecture (i18n)**:
  - Full bidirectional language support for **English, Hindi (हिंदी — default), Telugu (తెలుగు), and Tamil (தமிழ்)**.
  - Instant header language switcher with persistent user preference storage.
- **Temples Directory (`/temples` & `/temples/[slug]`)**:
  - Consecrated temple profiles (Kashi Vishwanath, Mahakaleshwar, Somnath, Kamakhya, etc.).
  - Darshan timings, historical significance, temple GPS directions, and linked pujas.
- **Multimedia Sacred Gallery (`/our-gallery`)**:
  - Filterable gallery covering Daily Aarti, Major Festivals, Hawan, and Temple Sevas with full lightbox view.
- **Spiritual Blog Engine (`/blog` & `/blog/[slug]`)**:
  - Editorial spiritual articles with structured SEO schema (`BlogPosting`), author credentials, reading times, and integrated puja cross-selling.

---

### Module 2: Vedic Booking Engine & Sankalp Customization
*Comprehensive, friction-free booking funnel built for devotee trust and high conversion.*

- **50+ Vedic Puja Catalog (`/book` & `/book/[service]`)**:
  - Granular ritual categories: Dosha Shanti, Health & Longevity, Prosperity, Griha Pravesh, Child Blessings, and Navgraha Shanti.
  - **Tiered Puja Packages**: Standard Seva, Premium Ritual, and VIP / Family Sankalp packages with dynamic pricing.
- **Auspicious Muhurat Date Picker**:
  - Dedicated date selection highlighting auspicious Tithis, festivals, and available slots.
- **Multi-Step Vedic Sankalp Form**:
  - Capture Devotee Name, Gotra (with guidance and default Kashyap Gotra support), City, and Mobile Number.
  - Dedicated field for specific wishes, family members' names, and prayers to be chanted during the ritual.
- **Sacred Chadhava & Add-Ons**:
  - Devotees can attach Gau Seva (cow feeding), Deep Daan, Brahmin Bhojan, Sacred Dhwaja, and Prasad Courier.
- **Dynamic Coupon & Discount Engine**:
  - Real-time coupon application (percentage or flat ₹ discount) with server-side validation against order value and user history.
- **Incomplete Booking Recovery (Cart Abandonment)**:
  - Sticky resumption bar allowing devotees to continue an interrupted booking without re-entering details.

---

### Module 3: Dual Payment Infrastructure & Automated Reconciliation
*Enterprise-grade security supporting instant mobile UPI payments and debit/credit cards.*

- **Direct UPI QR Code Checkout**:
  - Dynamic QR code generation matching the exact payable Dakshina.
  - Custom merchant QR image support (`/payment-qr.jpg`) displaying official UPI ID and payee name.
  - **1-Tap Mobile UPI Intent**: Opens Google Pay, PhonePe, Paytm, BHIM, or Cred directly on devotee smartphones.
  - 12-digit UPI UTR / Transaction Reference submission and verification workflow.
- **Razorpay Live Payment Gateway**:
  - Native Razorpay checkout modal supporting UPI, Credit/Debit Cards, Netbanking, and Wallets.
  - Authoritative server-side order creation (`/api/payments/razorpay/order`) in paise.
  - Secure HMAC-SHA256 signature verification (`/api/payments/verify`) preventing payment tampering.
- **Authoritative Webhook Listener (`/api/payments/razorpay/webhook`)**:
  - Background payment capture notifications with replay-attack protection and idempotency checking.
  - Automatic devotee account creation in `pending_activation` state upon payment confirmation.
- **Meta Ads Tracking (Pixel & CAPI)**:
  - Client-side Meta Pixel tracking + Server-side Meta Conversions API (CAPI) for verified Purchase event attribution.

---

### Module 4: Devotee Self-Service Portal & Digital Receipts
*Empowers devotees to manage their bookings, invoices, and completed ritual recordings.*

- **Digital Tax Invoice & Booking Receipts (`/booking/[bookingId]`)**:
  - Unique receipt serial numbering (`RCPT-YYYYMMDD-XXXXXX`).
  - Print-ready and downloadable PDF-style invoice layout.
  - Dynamic QR code for on-site receipt authenticity verification.
  - 1-click WhatsApp share button to forward receipt details to family members.
- **Devotee Dashboard (`/profile`)**:
  - Upcoming and completed puja records.
  - Self-service **Reschedule Booking** to a future date.
  - Self-service **Cancel Booking** with automated refund request generation.
  - Devotee **Star Rating & Written Testimonial** submission.
  - **Puja Video Streaming Desk**: Devotees can view live-stream links or watch high-definition recordings of their completed Sankalp puja uploaded by the admin.
- **Devotee Authentication System**:
  - Phone + Password authentication, OTP account verification, and automated password recovery.

---

### Module 5: Master Admin Control Center (`/admin` — 18 Functional Modules)
*A complete operational back-office allowing full management of the platform.*

1. **Analytics Dashboard**: Gross revenue metrics, completed pujas, active devotees, and monthly performance charts.
2. **Poojas Manager**: Create, edit, duplicate, sort, hide/show pujas, upload images, and set package tiers.
3. **Festivals & Events Manager**: Configure festival countdowns and featured seasonal rituals.
4. **Temples Manager**: Add and edit consecrated shrines, history, darshan timings, and location details.
5. **Blogs Manager**: Draft, schedule, and publish spiritual blog posts with SEO tags and meta descriptions.
6. **Bookings Audit Table**: Complete booking directory with search, status filters, and **Export to Excel (.xlsx)**.
7. **Orders & Transactions Manager**: Track gateway orders and review devotee UPI UTR reference codes.
8. **Refunds Manager**: Multi-step refund workflow: Review -> Approve -> Execute live Razorpay refund -> Reject with reason.
9. **Devotees Manager**: Devotee profiles, booking history audit, password resets, and **Export Devotees to Excel (.xlsx)**.
10. **Muhurat & Dates Manager**: Manage auspicious booking dates, block blackout dates, and configure slot capacity.
11. **Coupons Manager**: Create discount codes (Percentage or Flat ₹ discount, expiry date, min spend).
12. **Chatbot Knowledge Manager**: Train the AI Pandit assistant by adding custom Q&A pairs on rituals and rules.
13. **Add-ons Manager**: Manage extra sevas (Gau Seva, Deep Daan, Brahmin Bhojan, Prasad courier).
14. **Gallery Manager**: Upload, tag, and categorize temple photos and videos.
15. **Testimonials Manager**: Moderate, approve, or feature devotee reviews on the public homepage.
16. **FAQ Manager**: Add, edit, and re-order frequently asked questions across the website.
17. **CMS Site Content Editor**: Update hero headlines, helpline numbers, support emails, and footer copy without code changes.
18. **Account & Security Manager**: Change admin credentials, configure passwords, and manage active sessions.

---

### Module 6: Pandit AI Chatbot & Communication Engine
- **Intelligent Pandit AI Guide**:
  - Embedded floating assistant with built-in semantic RAG search over your catalog, pujas, and admin-trained knowledge.
  - Optional zero-setup Google Gemini or OpenAI LLM integration via environment keys.
- **Devotee Communication Desk**:
  - 1-Click WhatsApp Click-to-Chat integration prefilled with ritual inquiries.
  - Automated CEO email notifications via SMTP (Gmail) or Resend API.
  - Twilio WhatsApp / SMS integration readiness for automated receipt alerts.

---

### Module 7: Production Architecture, Security & Resilience
- **Next.js 15 App Router & React 19**: Ultra-fast SSR/SSG rendering, SEO metadata generation, and zero bundle bloat.
- **Dual-Mode Data Resilience**: Primary MongoDB Atlas database with automatic, fail-safe fallback to an encrypted local JSON store (`lib/json-store.ts`).
- **Enterprise Security**:
  - Strict input sanitization and Indian mobile number validation.
  - Rate limiting on APIs (preventing spam and bot attacks).
  - Anti-spam honeypot fields on forms.
  - Bcrypt password hashing and HMAC-signed session tokens.
- **Rigorous Verification & Quality Gates**:
  - 100% clean TypeScript strict compilation (`tsc --noEmit`).
  - **557 automated unit and integration tests passing** across 55 test suites.
  - Next.js production build passing cleanly across all 52 routes.

---

## 3. Commercial Investment & Pricing Breakdown

Below is the itemized cost breakdown for the complete scope of work delivered:

| Sr. | Module / Component | Scope Description | Investment (INR) |
|:---:|:---|:---|:---:|
| **1** | **Sacred Public Website & UI/UX** | Devotional brand design, responsive layouts, homepage, temples directory, gallery, blog, multi-language i18n (EN, HI, TE, TA). | ₹ 35,000 |
| **2** | **Vedic Booking Engine & Sankalp Funnel** | 50+ Puja catalog, multi-tier pricing, Gotra/Sankalp form, Muhurat calendar, Chadhava add-ons, dynamic coupons, abandoned cart recovery. | ₹ 40,000 |
| **3** | **Dual Payment Gateway & Automated Verification** | Dynamic UPI QR engine with 1-tap mobile app intent (GPay/PhonePe), Razorpay Live Gateway, webhook listener with HMAC security, and Meta Pixel/CAPI tracking. | ₹ 25,000 |
| **4** | **Devotee Self-Service Portal & Receipts** | Printable tax invoice receipts with QR verification, booking reschedule & cancel/refund workflows, reviews, devotee video streaming desk. | ₹ 25,000 |
| **5** | **18-Module Master Admin Dashboard** | Analytics, puja manager, blog CMS, Excel exports, order management, refund workflow, coupon creator, devotee database, and CMS editor. | ₹ 45,000 |
| **6** | **Pandit AI Assistant & Messaging Integrations** | Semantic RAG AI chatbot, WhatsApp click-to-chat, leadership email dispatch, automated reminders pipeline. | ₹ 15,000 |
| **7** | **Architecture, Cloud Database & Testing** | Next.js 15 setup, MongoDB Atlas integration with fail-safe fallback store, rate-limiting security, and complete 557 automated test suite. | ₹ 20,000 |
| **8** | **Legal Compliance & Payment Gateway KYC Setup** | Terms & Conditions, Cancellation & Refund Policy, Shipping Policy, and Contact Us pages required for Razorpay account activation. | ₹ 10,000 |
| | **TOTAL PROJECT VALUE** | **Complete Full-Stack Vedic Puja & Temple E-Commerce Solution** | **₹ 2,15,000** |

*(Note: Pricing figures above can be adjusted according to your agreed client contract or converted to your preferred currency).*

---

## 4. Suggested Milestone Payment Schedule

| Milestone | Deliverable | Percentage | Amount (INR) |
|---|---|:---:|:---:|
| **Milestone 1 (Mobilization)** | Project initiation, UI/UX architecture, database & multi-language setup. | 30% | ₹ 64,500 |
| **Milestone 2 (Core Development)** | Booking engine, puja catalog, payment gateways (UPI + Razorpay), and devotee portal. | 40% | ₹ 86,000 |
| **Milestone 3 (Admin & Quality Gates)** | 18-module admin suite, AI chatbot, automated tests (557 passed), and staging deployment. | 20% | ₹ 43,000 |
| **Milestone 4 (Final Handover & Launch)** | Production deployment, Razorpay webhook activation, credential handover, and domain pointing. | 10% | ₹ 21,500 |
| | **Total** | **100%** | **₹ 2,15,000** |

---

## 5. Exclusions & Client Responsibilities

The following third-party infrastructure accounts and running costs are paid directly by the client:
1. **Domain & Cloud Hosting**: Domain name registration, Vercel / VPS hosting server subscription.
2. **Payment Gateway Charges**: Razorpay transaction fees (standard 2% per transaction deducted directly by Razorpay).
3. **Database Cloud Account**: MongoDB Atlas cloud cluster (free tier or standard dedicated tier).
4. **Third-Party Messaging (If applicable)**: Twilio SMS / WhatsApp Business Cloud API credits (if automated push WhatsApp messages are chosen over free Click-to-Chat).
5. **Business Registration & Legal Entity**: GST, PAN, and bank account for merchant KYC verification.

---

## 6. Post-Launch Support & Warranty

- **30-Day Complimentary Warranty**: Free technical support covering bug fixes, minor text tweaks, and operational assistance starting from the date of final launch.
- **Annual Maintenance Contract (AMC - Optional)**: Available upon request covering routine security patches, Next.js updates, database backups, and monthly feature additions.

---

## 7. Acceptance & Authorization

To approve this quotation and authorize final deployment and handoff:

**Client Representative:**  
Name: _____________________________________  
Signature: ________________________________  
Date: _____________________________________  

**Development & Engineering Lead:**  
Name: _____________________________________  
Signature: ________________________________  
Date: _____________________________________  

