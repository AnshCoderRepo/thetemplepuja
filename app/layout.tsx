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

export const metadata: Metadata = {
  title: "The Temple Puja | Online Pooja Booking & Live Darshan",
  description:
    "Book pandit ji online for Satyanarayan Katha, Griha Pravesh, Rudrabhishek, Shani Dev Pooja, Navgraha Shanti. Certified pandits, authentic Vedic rituals, live darshan from sacred temples.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${devanagari.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
