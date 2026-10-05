import type { Metadata } from "next";
import { Playfair_Display, Poppins, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});

import { SITE_URL } from "@/lib/seo";
import { ScrollToTop, ErrorBoundary } from "@/components/common";
import { FloatingWhatsApp } from "@/features/contact";
import { BookingModal } from "@/features/bookings";
import Providers from "@/components/providers/Providers";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "templepujasewa | Online Pooja Booking & Sacred Rituals",
  description:
    "Book pandit ji online for Satyanarayan Katha, Griha Pravesh, Rudrabhishek, Shani Dev Pooja, Navgraha Shanti. Certified pandits, authentic Vedic rituals and HD video recordings of every pooja.",
  icons: {
    icon: "/logo.jpeg",
  },
  openGraph: {
    type: "website",
    siteName: "templepujasewa",
    title: "templepujasewa | Online Pooja Booking & Sacred Rituals",
    description:
      "Book pandit ji online for Satyanarayan Katha, Griha Pravesh, Rudrabhishek, Shani Dev Pooja, Navgraha Shanti. Certified pandits, authentic Vedic rituals and HD video recordings of every pooja.",
    images: [{ url: "/logo.jpeg", alt: "templepujasewa" }],
  },
  twitter: {
    card: "summary",
    title: "templepujasewa | Online Pooja Booking & Sacred Rituals",
    description:
      "Book pandit ji online for Satyanarayan Katha, Griha Pravesh, Rudrabhishek, Shani Dev Pooja, Navgraha Shanti. Certified pandits, authentic Vedic rituals and HD video recordings of every pooja.",
    images: ["/logo.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${devanagari.variable}`}
    >
      <body className="font-sans" suppressHydrationWarning>
        <Providers>
          <ErrorBoundary>
            {children}
            <BookingModal />
            <ScrollToTop />
            <FloatingWhatsApp />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
