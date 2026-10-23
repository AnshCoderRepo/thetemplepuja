"use client";

import { useI18n } from "@/components/providers";

const CONTENT = {
  hi: {
    eyebrow: "पावन पूजा सूची",
    title: "अपने व परिवार के लिए पावन पूजा चुनें",
    subtitle:
      "प्रमाणित वैदिक पंडितों द्वारा शुभ मुहूर्तों में संपन्न होने वाले प्रामाणिक अनुष्ठान। कुछ ही मिनटों में ऑनलाइन बुक करें।",
  },
  te: {
    eyebrow: "పవిత్ర పూజా విభాగం",
    title: "మీ పవిత్ర పూజను ఎంచుకోండి",
    subtitle:
      "ప్రామాణిక వేద పద్ధతిలో అర్హులైన పండితుల చేత శుభ తిథులలో పూజలు జరిపించండి. కొద్ది నిమిషాల్లో బుక్ చేసుకోండి.",
  },
  ta: {
    eyebrow: "புனித பூஜை அட்டவணை",
    title: "உங்கள் புனித பூஜையைத் தேர்வு செய்க",
    subtitle:
      "சான்றளிக்கப்பட்ட பண்டிதர்களால் சுப முகூர்த்தங்களில் நடத்தப்படும் வேத முறை பூஜைகள். நிமிடங்களில் ஆன்லைனில் பதிவு செய்க.",
  },
  en: {
    eyebrow: "Sacred Pooja Catalog",
    title: "Choose Your Sacred Pooja",
    subtitle:
      "Browse authentic Vedic poojas performed on auspicious dates by certified pandits. Book online in minutes.",
  },
};

export default function HomeCatalogHeader() {
  const { locale } = useI18n();
  const c = CONTENT[locale] || CONTENT.en;

  return (
    <div className="container-px mb-8 text-center">
      <span className="eyebrow">
        <span className="text-saffron-500">🪔</span>
        {c.eyebrow}
      </span>
      <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
        {c.title}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
        {c.subtitle}
      </p>
    </div>
  );
}
