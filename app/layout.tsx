import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

import dynamic from "next/dynamic";
import Script from "next/script";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
import { SITE_URL } from "@/lib/seo";
import { ErrorBoundary } from "@/components/common";
import { PublicHeader } from "@/components/layout";
import { MetaPixel } from "@/components/analytics";
import Providers from "@/components/providers/Providers";
import { FB_PIXEL_ID } from "@/lib/meta-pixel";

import GlobalClientModals from "@/components/common/GlobalClientModals";

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
      lang="hi"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="preload"
          as="image"
          href="/hero-ganesha-marble.jpg"
          fetchPriority="high"
        />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        <link rel="dns-prefetch" href="https://api.razorpay.com" />
        {FB_PIXEL_ID && (
          <>
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${FB_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <Providers>
          <MetaPixel />
          <ErrorBoundary>
            <PublicHeader />
            {children}
            <GlobalClientModals />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
