export type BlogStatus = "draft" | "published" | "archived";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  publishedAt: string; // ISO date YYYY-MM-DD
  readTime: string;
  imageUrl: string;
  relatedPoojaSlug?: string;
  relatedPoojaTitle?: string;
  tags: string[];
  status?: BlogStatus;
  createdAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  content: {
    introduction: string;
    sections: {
      heading: string;
      body: string;
      keyPoints?: string[];
    }[];
    conclusion: string;
  };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "mahamrityunjaya-jaap-benefits-significance",
    title: "The Spiritual Power & Benefits of Mahamrityunjaya Jaap: Vedic Healing & Longevity",
    excerpt: "Discover how chanting the sacred Mahamrityunjaya mantra dispels negative planetary doshas, alleviates chronic illness, and invokes the protective grace of Lord Shiva.",
    category: "Vedic Astrology & Healing",
    author: "Acharya Vidyadhar Shastri",
    authorRole: "Head Vedic Scholar, templepujasewa",
    publishedAt: "2026-09-15",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    relatedPoojaSlug: "maha-mrityunjaya-jap",
    relatedPoojaTitle: "Maha Mrityunjaya Jaap",
    tags: ["Mahamrityunjaya", "Lord Shiva", "Vedic Mantras", "Healing", "Longevity"],
    content: {
      introduction:
        "In the Rigveda, the Mahamrityunjaya Mantra stands as one of the most revered and potent sonic invocations ever revealed to the ancient Rishis. Attributed to Sage Markandeya, this sacred mantra addresses Lord Shiva as Tryambakam—the three-eyed lord who nurtures existence and liberates the soul from the bondage of mortality.",
      sections: [
        {
          heading: "1. The Divine Meaning of the Sacred Chants",
          body:
            "Every syllable of the Mahamrityunjaya mantra generates an acoustic resonance that calms the central nervous system and purifies subtle bio-energetic channels (nadis). When chanted with pure devotion and accurate Vedic meter, it acts as a cosmic shield against untimely suffering, accidents, and sudden crises.",
          keyPoints: [
            "Purifies psychological anxiety and mental disturbances.",
            "Balances the elemental forces within the physical body.",
            "Generates positive bio-vibrations for hospital recovery or long-term wellness.",
          ],
        },
        {
          heading: "2. Astrological Importance: Overcoming Markesh & Rahu-Ketu Doshas",
          body:
            "In Jyotish (Vedic astrology), when a devotee passes through a Markesh Dasha (period associated with physical distress) or acute afflictions caused by Saturn (Shani Sade Sati) and Rahu, learned astrologers universally prescribe the chanting of Mahamrityunjaya Jaap. The holy recitation invokes Mahadev’s compassionate darshan to mitigate harsh karmic repercussions.",
        },
        {
          heading: "3. How Group Puja Chanting Multiplies Spiritual Merits",
          body:
            "Performing this Jaap in a synchronized group pooja through consecrated pandits creates an amplified spiritual field. Devotees participating with their registered gotra and name receive the full sankalp fruits of the ceremonial havan and energized water offerings.",
        },
      ],
      conclusion:
        "Whether you are seeking physical vitality, freedom from deep-rooted fears, or divine protection for your family, Mahamrityunjaya Jaap remains an invaluable fountain of divine grace. Experience the recitation performed authentically at consecrated Shiva shrines with complete sankalp.",
    },
  },
  {
    slug: "satyanarayan-katha-benefits-muhurat-guide",
    title: "Why Satyanarayan Katha Brings Prosperity & Family Harmony: Complete Vedic Guide",
    excerpt: "Learn the deep spiritual significance of Lord Vishnu's Satyanarayan Pooja, auspicious Purnima muhurats, and how it blesses homes with peace, unity, and abundance.",
    category: "Family & Prosperity",
    author: "Pandit Radheshyam Joshi",
    authorRole: "Senior Sanskrit Ritualist",
    publishedAt: "2026-09-22",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1609743522653-52354461eb27?auto=format&fit=crop&w=1200&q=80",
    relatedPoojaSlug: "satyanarayan-katha",
    relatedPoojaTitle: "Satyanarayan Katha",
    tags: ["Satyanarayan", "Lord Vishnu", "Purnima", "Family Harmony", "Prosperity"],
    content: {
      introduction:
        "The Shri Satyanarayan Vrat and Katha is one of the most cherished community and household rituals across Sanatana Dharma. Narrated in the Reva Khanda of the Skanda Purana by Maharishi Suta, this ceremony honors the Supreme Truth (Satya) incarnate as Lord Narayana.",
      sections: [
        {
          heading: "1. The Power of Truth (Satya) in Modern Daily Life",
          body:
            "The five sacred chapters of the Satyanarayan Katha impart fundamental moral and spiritual lessons: keeping one's sacred vows, treating all beings with dignity, relinquishing false pride, and sharing blessings generously. When devotees listen to the narrative with genuine humility, domestic conflicts dissolve and mutual affection is renewed.",
        },
        {
          heading: "2. Auspicious Timing: Purnima, Ekadashi, and Milestones",
          body:
            "While Satyanarayan Pooja can be conducted on any auspicious day, Full Moon (Purnima) evenings and Ekadashi days are widely regarded as the most fruitful. Families also arrange this puja to mark new career beginnings, weddings, birthdays, and anniversaries.",
          keyPoints: [
            "Purnima evenings align with heightened lunar energy and calm mental clarity.",
            "Promotes financial stability and steady growth in family enterprises.",
            "Sweet Panchamrit and roasted wheat flour prasad share divine sweetness.",
          ],
        },
        {
          heading: "3. Sacred Offerings and Prasad Preparation",
          body:
            "The traditional 'Panjiri' or 'Sheera' prasad, accompanied by fresh bananas, milk, honey, tulsi leaves, and ghee, symbolizes spiritual nourishment. Every member whose name is recited in the sankalp receives the divine sanctification of Lord Vishnu.",
        },
      ],
      conclusion:
        "Gathering your family's names in a sacred Satyanarayan sankalp brings profound peace of mind and enduring blessings. Join thousands of devotees who celebrate auspicious milestones through our authentic online seva.",
    },
  },
  {
    slug: "rudrabhishek-pooja-vidhi-and-shiva-blessings",
    title: "Complete Guide to Rudrabhishek: Mantras, Holy Panchamrit & Spiritual Upliftment",
    excerpt: "An in-depth guide on the Vedic origins of Rudrabhishek, how sacred offerings soothe cosmic energies, and why performing it at ancient Jyotirlinga temples yields profound spiritual peace.",
    category: "Shiva Rituals",
    author: "Swami Nityananda Giri",
    authorRole: "Vedic Scholar & Astrologer",
    publishedAt: "2026-09-28",
    readTime: "6 min read",
    imageUrl: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1200&q=80",
    relatedPoojaSlug: "rudrabhishek",
    relatedPoojaTitle: "Rudrabhishek Pooja",
    tags: ["Rudrabhishek", "Shiva", "Shukla Paksha", "Panchamrit", "Jyotirlinga"],
    content: {
      introduction:
        "Rudrabhishek is universally recognized as the pinnacle of Shaivite Vedic rituals. Sourced directly from the Sri Rudram hymn in the Krishna Yajurveda (Taittiriya Samhita), this ceremony continuously bathes the Shivalinga in sacred holy libations while chanting the 11 Anuvakas of the Namakam and Chamakam.",
      sections: [
        {
          heading: "1. The Significance of the Sacred Dravyams (Substances)",
          body:
            "Each substance poured over the holy Shivalinga corresponds to a specific spiritual and material blessing:",
          keyPoints: [
            "Pure Cow's Milk: Bestows long life, mental purity, and good health.",
            "Sugarcane Juice (Ikshu Rasa): Dispels enmity and brings financial prosperity.",
            "Honey (Madhu): Invokes sweetness in speech and harmonious relationships.",
            "Ghee & Curd: Promotes progeny, clarity of intellect, and bodily stamina.",
            "Gangajal: Cleanses past negative karmas and awakens pure consciousness.",
          ],
        },
        {
          heading: "2. Inner Meaning: Dissolving Ego and Material Sorrows",
          body:
            "Lord Shiva is Ashutosh—the one who is easily pleased by devotion. The rhythmic repetition of the Sri Rudram acknowledges divinity in all aspects of creation, both fierce and serene. By witnessing or initiating this holy abhishek, devotees feel an instantaneous lightness of spirit and deep meditative stillness.",
        },
        {
          heading: "3. Best Days for Rudrabhishek",
          body:
            "Mondays, Pradosh Vrats, Maha Shivratri, and Shravan month are exceptionally meritorious occasions for performing Rudrabhishek. When performed with your gotra sankalp at historic temple sanctums, the sacred energy uplifts your entire lineage.",
        },
      ],
      conclusion:
        "Participate in authentic Rudrabhishek performed by credentialed priests who chant the Sri Rudram with precise Vedic intonation. View live video darshan and receive the sanctified vibhuti prasad at your doorstep.",
    },
  },
  {
    slug: "navagraha-shanti-pooja-planetary-balance",
    title: "Navagraha Shanti Pooja: Harmonizing the 9 Planetary Energies in Your Horoscope",
    excerpt: "How planetary transits and natal Kundali afflictions affect career, relationships, and peace of mind — and how authentic Vedic Navagraha mantras restore harmony.",
    category: "Kundali & Dosha Nivaran",
    author: "Pandit Devendra Sharma",
    authorRole: "Consultant Jyotish Acharya",
    publishedAt: "2026-10-04",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    relatedPoojaSlug: "navgraha-shanti",
    relatedPoojaTitle: "Navagraha Shanti Pooja",
    tags: ["Navagraha", "Kundali", "Planetary Transit", "Astrology", "Shanti"],
    content: {
      introduction:
        "According to Vedic philosophy, human existence on Earth is intimately intertwined with cosmic cycles. The Navagrahas—Surya (Sun), Chandra (Moon), Mangala (Mars), Budha (Mercury), Brihaspati (Jupiter), Shukra (Venus), Shani (Saturn), Rahu, and Ketu—act as the cosmic deliverers of our accumulated karmas.",
      sections: [
        {
          heading: "1. Recognizing Planetary Imbalances",
          body:
            "When specific planets occupy debility, combustion, or malefic aspects in one's birth chart, the native may encounter unexplained obstacles. For instance, an afflicted Sun impacts confidence and fatherly relations; a challenged Moon stirs emotional anxiety; while Saturn's discipline demands patience through delays.",
          keyPoints: [
            "Restores equilibrium to conflicting planetary periods (Mahadashas/Antardashas).",
            "Clears unseen obstacles in career progress, academic focus, and wealth retention.",
            "Pacifies Kaal Sarp, Manglik, and Rahu afflictions through authentic samidha offerings.",
          ],
        },
        {
          heading: "2. The Nine Sacred Grains and Woods (Navadhanya & Samidha)",
          body:
            "During Navagraha Shanti, nine distinct varieties of consecrated grains (Navadhanya) and holy sacrificial woods (such as Arka for Sun, Palasa for Moon, Khadira for Mars, and Shami for Saturn) are offered to the sacred fire with specific Vedic Beej Mantras.",
        },
      ],
      conclusion:
        "By participating in a consecrated Navagraha Shanti Pooja, you realign your life's rhythms with benevolent cosmic grace. Book your family sankalp with our verified pandits.",
    },
  },
  {
    slug: "griha-pravesh-muhurat-rituals-vastu-shanti",
    title: "Auspicious Griha Pravesh & Vastu Shanti Rituals: Infusing Divine Light into Your New Home",
    excerpt: "Essential guidelines for entering a new home with sacred Ganesha puja, Navagraha homam, and Vastu purification to welcome continuous prosperity and auspicious vibrations.",
    category: "Home & Vastu",
    author: "Acharya Vidyadhar Shastri",
    authorRole: "Head Vedic Scholar, templepujasewa",
    publishedAt: "2026-10-08",
    readTime: "5 min read",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    relatedPoojaSlug: "griha-pravesh",
    relatedPoojaTitle: "Griha Pravesh Pooja",
    tags: ["Griha Pravesh", "Vastu Shanti", "New Home", "Auspicious Muhurat", "Ganesha"],
    content: {
      introduction:
        "Entering a newly acquired home is one of life's most joyous and monumental milestones. In the Vedic tradition, a house is not merely bricks and mortar; it is a sacred temple that houses the family's lineage, hopes, and memories. Griha Pravesh purifies the spatial energy and honors the Vastu Purusha.",
      sections: [
        {
          heading: "1. The Three Sacred Categories of Griha Pravesh",
          body:
            "Classical Vedic treatises classify house entries into three categories: Apoorva (first-time entry into a newly constructed dwelling), Sapoorva (re-entering an existing home after migration), and Dwandhav (renovation entry after repair or structural change). Each has specialized rituals.",
          keyPoints: [
            "Boiling fresh milk until it overflows symbolizes abundant prosperity and sweet family life.",
            "Carrying a consecrated copper Kalash filled with holy water and mango leaves welcomes divine Lakshmi.",
            "Vastu Purusha Havan dispels directional defects and clears stagnant construction energies.",
          ],
        },
        {
          heading: "2. Crucial Steps During the Ceremony",
          body:
            "The ceremony begins with Lord Ganesha invocation at the threshold to remove all future impediments, followed by Navagraha Puja and the auspicious boiling of milk. The holy pandit ji sprinkles sanctified water from the kalash in all four corners of the premises.",
        },
      ],
      conclusion:
        "Ensure your new home begins with divine blessings, harmony, and lasting joy. Schedule your auspicious Griha Pravesh ceremony with templepujasewa's experienced Acharyas.",
    },
  },
];

export function isPostPublished(post: BlogPost): boolean {
  if (!post) return false;
  // If status is unspecified (e.g. legacy default posts), treat as published.
  if (post.status === undefined || post.status === "published") return true;
  return false;
}

export function activeBlogPosts(list: BlogPost[] = BLOG_POSTS): BlogPost[] {
  return list.filter(isPostPublished);
}

export function getBlogPost(
  slug: string,
  list: BlogPost[] = BLOG_POSTS
): BlogPost | undefined {
  return list.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(list: BlogPost[] = BLOG_POSTS): string[] {
  return activeBlogPosts(list).map((p) => p.slug);
}

