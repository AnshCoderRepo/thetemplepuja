export type ChatbotCategory =
  | "pujas"
  | "temples"
  | "bookings"
  | "payments"
  | "chadhava"
  | "events"
  | "faqs"
  | "general";

export interface ChatbotKnowledgeEntry {
  id: string;
  title: string;
  category: ChatbotCategory;
  question?: string;
  answer: string;
  keywords?: string[];
  updatedAt: string;
}

export interface ChatbotSettings {
  systemInstructions: string;
  businessName: string;
  welcomeMessage: string;
  fallbackMessage: string;
  supportPhone: string;
}

export interface PlatformSettings {
  whatsappChannelUrl?: string;
}

export const DEFAULT_CHATBOT_SETTINGS: ChatbotSettings = {
  businessName: "templepujasewa",
  welcomeMessage:
    "🙏 Namaste! I am your Pandit AI Spiritual Guide. How may I assist you today with Vedic poojas, temple sevas, or booking details?",
  fallbackMessage:
    "🪔 For personalized guidance or specific queries not covered here, please connect directly with our temple coordinators on WhatsApp.",
  supportPhone: "+91 96210 14155",
  systemInstructions: `You are Pandit AI, a knowledgeable, reverent, and polite spiritual guide for "templepujasewa" (thetemplepuja.com).
Your mission is to answer devotee questions about Vedic poojas, sacred temples, puja packages, dakshina/pricing, chadhava add-ons, booking procedures, payment receipts, and upcoming Hindu festivals.

Guidelines:
1. Tone: Respectful, serene, authentic Vedic tradition (use "Namaste", "Om Shanti", "Har Har Mahadev", "Jai Shri Ram" where fitting).
2. Accuracy: Use ONLY the provided business catalog and training knowledge. Do not invent fake prices, unverified dates, or unauthorized guarantees.
3. Pricing & Packages: Mention starting prices accurately (e.g. starting from ₹501 up to ₹2,501+ based on packages like Individual, Family, and VIP).
4. Devotee Presence: Explain that physical presence is not mandatory — our certified Vedic pandits chant the devotee's specific Name and Gotra during the sankalp, and an HD video recording of the ritual is shared.
5. Chadhava & Prasad: Prasad and blessed energized samagri (silver coin, rudraksha, bhog) are delivered within 2-5 business days across India.
6. Privacy & Booking Lookup: If a devotee asks for private booking or payment status, politely instruct them to provide their registered 10-digit mobile number so we can look up their records securely.
7. Fallback: If an inquiry cannot be answered by our business knowledge, guide the devotee to contact our 24/7 WhatsApp customer helpline.`,
};

export const DEFAULT_CHATBOT_KNOWLEDGE: ChatbotKnowledgeEntry[] = [
  // 1. Pujas & Rituals
  {
    id: "kb-puja-popular",
    title: "Popular Vedic Poojas Available",
    category: "pujas",
    question: "Which poojas and rituals can I book on templepujasewa?",

    answer:
      "We offer authentic Vedic rituals performed by certified pandits, including: Satyanarayan Katha (family prosperity & peace), Griha Pravesh (new home sanctification), Rudrabhishek (Lord Shiva blessings & obstacle removal), Navgraha Shanti (planetary dosha remedies), Maha Mrityunjaya Jaap (health & longevity), and Shani Dev Pooja (protection against Shani Sade Sati). Every ritual includes personal sankalp with your name and gotra.",
    keywords: ["satyanarayan", "griha pravesh", "rudrabhishek", "navgraha", "maha mrityunjaya", "shani", "rituals"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "kb-puja-packages",
    title: "Puja Packages & Pricing Tiers",
    category: "pujas",
    question: "What is the price of pooja and available packages?",
    answer:
      "Our poojas start from ₹501. Typical packages include:\n• Standard / Individual Seva: 1 Devotee Sankalp, essential samagri, and HD video recording.\n• Family / Joint Seva: Up to 4 family members sankalp, comprehensive Vedic samagri, and certified pandit ji recitation.\n• VIP / Mahapooja: Devotee + partner + full family gotra, special flower decoration, energized prasad kit dispatched to home, and priority pandit coordination.",
    keywords: [
      "price",
      "cost",
      "pricing",
      "pooja price",
      "puja price",
      "dakshina",
      "package",
      "packages",
      "tier",
      "fee",
      "rate",
      "501",
    ],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "kb-puja-recording",
    title: "HD Video Recording & Live Darshan",
    category: "pujas",
    question: "Will I get a video recording of my pooja?",
    answer:
      "Yes! Every pooja is recorded in high definition (HD). You will receive your personalized video link where you can clearly see the pandit ji reciting your Name, Gotra, and Sankalp. The link is available in your devotee dashboard and sent via WhatsApp/email shortly after the ritual concludes.",
    keywords: ["video", "recording", "watch", "hd", "proof", "darshan", "live"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },

  // 2. Temples
  {
    id: "kb-temple-network",
    title: "Associated Sacred Temples",
    category: "temples",
    question: "Which temples are associated with templepujasewa?",

    answer:
      "We conduct sacred archana and sevas in renowned jyotirlingas and temples across India, including Kashi Vishwanath (Varanasi), Mahakaleshwar (Ujjain), Somnath Temple (Gujarat), Trimbakeshwar (Nashik), Kamakhya Devi Temple (Guwahati), and Siddhivinayak Temple (Mumbai). Offerings and bilva patra/chadhava are made directly at the temple premises.",
    keywords: ["temple", "temples", "kashi", "vishwanath", "mahakaleshwar", "somnath", "trimbakeshwar", "ujjain", "varanasi"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },

  // 3. Bookings
  {
    id: "kb-booking-process",
    title: "How to Book a Pooja Online",
    category: "bookings",
    question: "How do I book a pooja step by step?",
    answer:
      "Booking is simple and takes less than 2 minutes:\n1. Choose your desired pooja or festival seva from the catalog.\n2. Select your preferred auspicious date and muhurat slot.\n3. Enter your devotee details (Name, Gotra, City, and WhatsApp number).\n4. Select optional blessed chadhava add-ons.\n5. Complete payment via UPI QR (instant confirmation) or online card.\n6. Receive instant booking confirmation and receipt with your unique Booking ID.",
    keywords: ["how to book", "booking procedure", "steps", "reserve", "slot", "muhurat", "procedure"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "kb-booking-reschedule-cancel",
    title: "Rescheduling & Cancellation Policy",
    category: "bookings",
    question: "Can I reschedule or cancel my pooja booking?",
    answer:
      "Yes. You can reschedule your booking to any upcoming muhurat date free of charge up to 24 hours prior to the scheduled ritual time via your devotee profile or by messaging our support coordinators. Cancellations requested before pandit preparation can be processed with full refund.",
    keywords: ["cancel", "reschedule", "change date", "postpone", "cancellation", "refund policy"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },

  // 4. Payments
  {
    id: "kb-payments-methods",
    title: "Payment Methods & QR Code",
    category: "payments",
    question: "What payment methods are supported?",
    answer:
      "We support direct UPI payment (Scan & Pay using GPay, PhonePe, Paytm, BHIM, or any banking UPI app) with instant verification using your 12-digit UTR / transaction ID. We also support Razorpay online checkout for debit/credit cards and net banking. All transactions are 100% encrypted and safe.",
    keywords: ["payment", "pay", "upi", "qr", "gpay", "phonepe", "paytm", "cards", "razorpay", "utr"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "kb-payments-receipt",
    title: "Payment Receipt & Invoice",
    category: "payments",
    question: "Do I get an official receipt for my payment?",
    answer:
      "Yes! An official digital receipt (e.g. RCPT-20261001-XXXX) with your transaction breakdown, pandit details, and seva particulars is generated immediately upon confirmation. You can view, print, or download your PDF receipt anytime from your Devotee Profile.",
    keywords: ["receipt", "invoice", "bill", "tax", "download receipt", "payment proof"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },

  // 5. Chadhava
  {
    id: "kb-chadhava-addons",
    title: "Blessed Chadhava & Prasad Delivery",
    category: "chadhava",
    question: "What is Chadhava and how is Prasad delivered?",
    answer:
      "Chadhava are sacred offerings made at the deity's altar during your pooja, such as pure silver coins, energized 5-mukhi Rudraksha, sacred Ganga jal, cow seva dakshina, and blessed sweets. After the ritual, the energized prasad kit is carefully packed in eco-friendly protective packaging and dispatched to your home address across India within 2–5 business days.",
    keywords: ["chadhava", "prasad", "samagri", "kit", "delivery", "shipping", "silver coin", "rudraksha"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },

  // 6. Events & Festivals
  {
    id: "kb-events-festivals",
    title: "Upcoming Festivals & Special Sevas",
    category: "events",
    question: "What upcoming festivals and special group rituals do you have?",
    answer:
      "We organize special Vedic sevas during major Hindu occasions: Maha Shivratri (Maha Rudrabhishek at Jyotirlingas), Chaitra & Sharad Navratri (Chandi Path & Durga Saptashati), Janmashtami (Laddu Gopal abhishek), Ganesh Chaturthi, and Diwali Lakshmi Kuber Puja. Slots for auspicious festival dates have limited sankalp seats and can be reserved from the 'Festivals & Events' section.",
    keywords: ["festival", "festivals", "events", "shivratri", "navratri", "diwali", "janmashtami", "upcoming", "muhurat"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },

  // 7. FAQs & General
  {
    id: "kb-faq-physical-presence",
    title: "Is Physical Presence Required for the Pooja?",
    category: "faqs",
    question: "Do I need to be physically present at the temple or pooja location?",
    answer:
      "No, physical presence is not required. In accordance with Vedic Shastras, a consecrated representative pandit can perform the ritual on your behalf once you provide your Gotra and Sankalp intention. You can participate virtually, listen to the mantras, and receive the divine blessings along with the video recording and delivered prasad.",
    keywords: ["physical presence", "need to attend", "be there", "remote", "online", "distance", "virtual"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
  {
    id: "kb-faq-support-whatsapp",
    title: "Devotee Support & WhatsApp Help",
    category: "faqs",
    question: "How can I contact customer support or get help on WhatsApp?",
    answer:
      "Our devotee care team is available 7 days a week. You can tap the WhatsApp icon on the screen to chat directly with our temple coordinators, call our helpline at +91 96210 14155, or email infotemplepujasewa@gmail.com for any questions regarding bookings, pandit coordination, or customized rituals.",
    keywords: ["support", "contact", "whatsapp", "helpline", "phone", "email", "help", "coordinator"],
    updatedAt: "2026-10-14T00:00:00.000Z",
  },
];
