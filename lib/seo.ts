// SEO helpers — the single source of truth for the public origin and the
// JSON-LD structured data that helps Google understand and rank the site.
import type { Pooja } from "./data";

/** Public origin. Set SITE_URL in production; falls back to the known domain
 * so sitemap.xml / robots.txt / canonical URLs are correct out of the box. */
export const SITE_URL = process.env.SITE_URL ?? "https://thetemplepuja.com";

const ORG = {
  "@type": "Organization",
  name: "The Temple Puja",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.jpeg`,
  description:
    "India's trusted digital spiritual platform for booking certified pandits online — Satyanarayan Katha, Rudrabhishek, Griha Pravesh, Shani Dev Pooja and more, with HD video recordings of every ritual.",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-8765301563",
    contactType: "customer service",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [`https://wa.me/918765301563`],
} as const;

export function organizationLd() {
  return { "@context": "https://schema.org", ...ORG };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Temple Puja",
    url: SITE_URL,
    description: ORG.description,
    inLanguage: "en",
  };
}

/** FAQPage schema for the home page's frequently-asked questions. */
export function faqPageLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** ItemList of every bookable pooja — gives Google a machine-readable catalog. */
export function itemListLd(poojas: Pooja[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Poojas & Rituals at The Temple Puja",
    numberOfItems: poojas.length,
    itemListElement: poojas.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      url: `${SITE_URL}/book/${p.slug}`,
    })),
  };
}

/** Service schema for a single pooja detail page — the core ranking entity. */
export function serviceLd(pooja: Pooja) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${pooja.title} Pooja Booking Online`,
    description: pooja.description,
    url: `${SITE_URL}/book/${pooja.slug}`,
    serviceType: "Pooja / Puja",
    category: "Religious Services",
    provider: {
      "@type": "Organization",
      name: "The Temple Puja",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.jpeg`,
    },
    areaServed: { "@type": "Country", name: "India" },
    offers: {
      "@type": "Offer",
      price: String(pooja.price),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/book/${pooja.slug}`,
      description: `${pooja.title} performed by certified pandits, with sankalp and HD video recording included.`,
    },
  };
}
