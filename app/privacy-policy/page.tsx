import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  FileText,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight,
  UserCheck,
  Database,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Footer } from "@/components/layout";
import { SITE_CONFIG, getWhatsAppUrl } from "@/lib/config";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy | TemplePujaSewa",
  description:
    "Read the TemplePujaSewa Privacy Policy. Learn how we collect, process, protect, and respect devotee personal data and sacred Sankalp information.",
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: "Privacy Policy | TemplePujaSewa",
    description:
      "Official privacy practices, devotee data protection, and sacred ritual privacy policy for TemplePujaSewa.",
    url: `${SITE_URL}/privacy-policy`,
    siteName: "TemplePujaSewa",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  const whatsappUrl = getWhatsAppUrl(
    "Namaste, I have a query regarding my privacy and personal data on TemplePujaSewa."
  );

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between">
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-16">
        {/* ─── Breadcrumb Navigation ─── */}
        <div className="container-px mx-auto max-w-4xl mb-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-soft">
            <Link href="/" className="hover:text-saffron-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-ink">Privacy Policy</span>
          </nav>
        </div>

        {/* ─── Document Header ─── */}
        <div className="container-px mx-auto max-w-4xl mb-8">
          <div className="rounded-3xl border border-saffron-200/90 bg-gradient-to-br from-white via-amber-50/40 to-saffron-50/30 p-6 sm:p-10 shadow-card">
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500/10 border border-saffron-300/60 px-3 py-1 text-xs font-bold text-saffron-800">
                <ShieldCheck className="h-3.5 w-3.5 text-saffron-600" />
                Legal Transparency & Devotee Trust
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                Last Updated: October 2026
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-4.5xl font-bold tracking-tight text-ink leading-tight">
              Privacy Policy – TemplePujaSewa
            </h1>
            <p className="mt-3 text-sm sm:text-base text-ink-soft leading-relaxed max-w-3xl">
              Welcome to <strong>TemplePujaSewa</strong>. This Privacy Policy sets out how TemplePujaSewa
              (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or &quot;Platform&quot;) collects, processes,
              protects, and stores personal data when you access or book spiritual and ritual services
              through{" "}
              <a
                href="https://www.templepujasewa.com/"
                className="text-saffron-600 underline hover:text-saffron-700 font-medium"
              >
                https://www.templepujasewa.com/
              </a>
              .
            </p>

            <div className="mt-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                This document describes our intended privacy practices with reference to applicable
                Indian data protection and information technology laws (including the Information
                Technology Act, 2000 and applicable data protection frameworks).
              </span>
            </div>
          </div>
        </div>

        {/* ─── Document Content ─── */}
        <div className="container-px mx-auto max-w-4xl space-y-8">
          <article className="rounded-3xl border border-saffron-200/70 bg-white p-6 sm:p-10 shadow-card text-ink space-y-8 leading-relaxed text-sm sm:text-base">
            
            {/* 1. Information We Collect */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-saffron-900 border-b border-saffron-100 pb-2">
                <Database className="h-5 w-5 text-saffron-600 shrink-0" />
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  1. Information We Collect
                </h2>
              </div>
              <p className="text-ink-soft">
                We aim to collect only the personal information necessary to coordinate and perform requested spiritual services.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-ink-soft">
                <li>
                  <strong className="text-ink">Identity & Contact Data:</strong> Devotee&apos;s name, phone / WhatsApp number, and email address.
                </li>
                <li>
                  <strong className="text-ink">Sacred Sankalp & Ritual Data:</strong> Devotee&apos;s name, Gotra, Nakshatra, Rashi, prayer intent (Sankalp), and names/details of family members included in the ceremony. Where another person&apos;s personal data is submitted, the person submitting it must have an appropriate lawful basis and any consent required by applicable law.
                </li>
                <li>
                  <strong className="text-ink">Order & Transaction Data:</strong> Unique Booking ID, puja selected, time/date of ritual, payment status, and physical shipping address when consecrated prasad delivery is selected.
                </li>
                <li>
                  <strong className="text-ink">Technical Logs:</strong> IP address, operating system, device details, and session cookies used for website navigation, platform security, and fraud monitoring, as applicable.
                </li>
                <li>
                  <strong className="text-ink">Payment Data:</strong> We do not collect or store full credit/debit card numbers, CVVs, UPI PINs, or sensitive banking credentials on our servers. All digital payments are processed through verified, PCI DSS-compliant payment gateways (such as Razorpay) and official UPI deep-link intent flows.
                </li>
              </ul>
            </section>

            {/* 2. Purpose of Processing */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-saffron-900 border-b border-saffron-100 pb-2">
                <FileText className="h-5 w-5 text-saffron-600 shrink-0" />
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  2. Purpose of Processing
                </h2>
              </div>
              <p className="text-ink-soft">
                We process personal information for legitimate, disclosed spiritual and operational purposes, including:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-ink-soft">
                <li>
                  Booking, scheduling, and coordinating selected temple-based puja, havan, and Vedic Sankalp rituals.
                </li>
                <li>
                  Sending transactional communications such as booking confirmations, digital receipts, live-stream links, ritual video recordings, and prasad shipment tracking updates through configured WhatsApp, SMS, or email services.
                </li>
                <li>
                  Maintaining accounting, invoicing, tax, and transaction records where legally required under applicable Indian laws.
                </li>
                <li>
                  Securing the platform against fraud, unauthorized access, abuse, and malicious activity.
                </li>
              </ul>
            </section>

            {/* 3. Data Sharing and Third-Party Disclosures */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-saffron-900 border-b border-saffron-100 pb-2">
                <UserCheck className="h-5 w-5 text-saffron-600 shrink-0" />
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  3. Data Sharing and Third-Party Disclosures
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-ink-soft">
                <li>
                  <strong className="text-ink">Sankalp Sharing:</strong> Ritual-specific details (devotee names, gotra, and spiritual intentions) are shared with the assigned certified Vedic Pandit or relevant temple authorities solely to perform the requested Vedic recitation and puja ceremonies.
                </li>
                <li>
                  <strong className="text-ink">No Sale of Personal Data:</strong> We do not sell, rent, trade, or monetize devotees&apos; personal information or spiritual details to marketing brokers or commercial third parties.
                </li>
                <li>
                  <strong className="text-ink">Operational Service Providers:</strong> Necessary data is shared with trusted operational partners—including payment gateways (Razorpay), automated transactional messaging providers (WhatsApp Business API / Twilio), secure cloud database infrastructure, and logistics partners for consecrated prasad courier delivery—subject to confidentiality and legal safeguards.
                </li>
                <li>
                  <strong className="text-ink">Legal Compliance:</strong> We may disclose personal data where required or permitted by applicable law, statutory authorities, court orders, or valid legal process.
                </li>
              </ul>
            </section>

            {/* 4. Children's Personal Data */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-saffron-900 border-b border-saffron-100 pb-2">
                <ShieldCheck className="h-5 w-5 text-saffron-600 shrink-0" />
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  4. Children&apos;s Personal Data
                </h2>
              </div>
              <p className="text-ink-soft">
                When family members, including children or minors, are included in a family puja or Kul Sankalp, their names and gotra are collected solely for religious recitation during the ceremony. Such details must be provided by the child&apos;s parent or legal guardian. We do not knowingly market products, target advertising, or establish direct contractual accounts with minors without parental supervision.
              </p>
            </section>

            {/* 5. Privacy Rights and Requests */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-saffron-900 border-b border-saffron-100 pb-2">
                <Eye className="h-5 w-5 text-saffron-600 shrink-0" />
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  5. Privacy Rights and Requests
                </h2>
              </div>
              <p className="text-ink-soft">
                Devotees and users may submit requests concerning their personal information, subject to applicable law:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-ink-soft">
                <li>
                  <strong className="text-ink">Access & Confirmation:</strong> Request confirmation of whether your personal information is being processed, along with a summary of the data and service records held.
                </li>
                <li>
                  <strong className="text-ink">Correction & Updating:</strong> Request correction or updating of inaccurate, outdated, or incomplete personal details.
                </li>
                <li>
                  <strong className="text-ink">Erasure:</strong> Request deletion of your personal data where legally available, subject to statutory retention obligations (e.g. tax, accounting, and anti-fraud audit records).
                </li>
                <li>
                  <strong className="text-ink">Withdrawal of Consent:</strong> Where processing is based on your consent, withdraw consent for future communications or non-mandatory data processing.
                </li>
              </ul>
              <p className="text-ink-soft pt-1">
                To submit any privacy request, please write to our Devotee Care team at{" "}
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="text-saffron-600 font-semibold underline hover:text-saffron-700"
                >
                  {SITE_CONFIG.contact.email}
                </a>{" "}
                with your registered mobile number and booking details.
              </p>
            </section>

            {/* 6. Data Security and Retention */}
            <section className="space-y-3">
              <div className="flex items-center gap-2.5 text-saffron-900 border-b border-saffron-100 pb-2">
                <Lock className="h-5 w-5 text-saffron-600 shrink-0" />
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  6. Data Security and Retention
                </h2>
              </div>
              <p className="text-ink-soft">
                We implement industry-standard technical and organizational safeguards to protect personal data from unauthorized access, alteration, disclosure, or destruction. This includes HTTPS/TLS encryption for all data in transit across our website, secured database storage with access control mechanisms, and zero server storage of card or banking credentials.
              </p>
              <p className="text-ink-soft">
                We retain personal information only for as long as necessary to fulfill the requested spiritual rituals, coordinate prasad delivery, resolve disputes, maintain accounting and taxation records, and comply with applicable statutory retention requirements. When no longer required, data is securely deleted or anonymized.
              </p>
            </section>

            {/* 7. Grievance Redressal and Contact */}
            <section className="space-y-4 pt-2">
              <div className="flex items-center gap-2.5 text-saffron-900 border-b border-saffron-100 pb-2">
                <Phone className="h-5 w-5 text-saffron-600 shrink-0" />
                <h2 className="font-display text-xl sm:text-2xl font-bold">
                  7. Grievance Redressal and Contact
                </h2>
              </div>
              <p className="text-ink-soft">
                If you have any questions, concerns, or grievances regarding this Privacy Policy or how your personal information is handled, you may reach out to our dedicated Devotee Care and Grievance Desk:
              </p>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">
                      Platform Name
                    </span>
                    <span className="font-display font-bold text-ink">TemplePujaSewa</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">
                      Official Website
                    </span>
                    <a
                      href="https://www.templepujasewa.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-saffron-600 hover:underline font-medium"
                    >
                      https://www.templepujasewa.com/
                    </a>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">
                      Grievance Contact
                    </span>
                    <span className="font-semibold text-ink">Devotee Care & Operations</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${SITE_CONFIG.contact.email}`}
                      className="text-saffron-600 hover:underline font-bold"
                    >
                      {SITE_CONFIG.contact.email}
                    </a>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">
                      Helpline / WhatsApp
                    </span>
                    <a
                      href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
                      className="text-saffron-600 hover:underline font-bold"
                    >
                      {SITE_CONFIG.contact.phoneDisplay}
                    </a>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] block">
                      Working Hours
                    </span>
                    <span className="text-ink font-medium">
                      10:00 AM – 7:00 PM IST, Monday to Saturday
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-200/80 text-xs text-amber-950 font-medium leading-relaxed">
                  ⏱️ <strong>Resolution Timelines:</strong> We acknowledge devotee privacy and grievance
                  queries within 24 hours of receipt and aim for complete resolution within 15 business
                  days, in accordance with applicable legal guidelines.
                </div>
              </div>

              {/* Direct Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-500 hover:from-saffron-600 hover:to-amber-600 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-soft transition-all"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email Devotee Care ({SITE_CONFIG.contact.email})</span>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-saffron-300 bg-white hover:bg-saffron-50 text-saffron-900 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-2xs transition-all"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  <span>WhatsApp Helpline ({SITE_CONFIG.contact.phoneDisplay})</span>
                </a>
              </div>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
