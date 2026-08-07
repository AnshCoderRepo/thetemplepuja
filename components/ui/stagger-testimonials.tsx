"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SQRT_5000 = Math.sqrt(5000);

export interface StaggerTestimonial {
  id: string | number;
  quote: string;
  by: string;
  /** Initials avatar (e.g. "PS") — used when `imgSrc` is absent. */
  avatar?: string;
  /** Tailwind gradient stops for the initials avatar, e.g. "from-rose-400 to-pink-600". */
  avatarColor?: string;
  /** Optional photo instead of initials. */
  imgSrc?: string;
}

const defaultItems: StaggerTestimonial[] = [
  { id: 0, quote: "My favorite solution in the market. We work 5x faster with COMPANY.", by: "Alex, CEO at TechCorp", imgSrc: "https://i.pravatar.cc/150?img=1" },
  { id: 1, quote: "I'm confident my data is safe with COMPANY. I can't say that about other providers.", by: "Dan, CTO at SecureNet", imgSrc: "https://i.pravatar.cc/150?img=2" },
  { id: 2, quote: "I know it's cliche, but we were lost before we found COMPANY. Can't thank you guys enough!", by: "Stephanie, COO at InnovateCo", imgSrc: "https://i.pravatar.cc/150?img=3" },
  { id: 3, quote: "COMPANY's products make planning for the future seamless. Can't recommend them enough!", by: "Marie, CFO at FuturePlanning", imgSrc: "https://i.pravatar.cc/150?img=4" },
  { id: 4, quote: "If I could give 11 stars, I'd give 12.", by: "Andre, Head of Design at CreativeSolutions", imgSrc: "https://i.pravatar.cc/150?img=5" },
  { id: 5, quote: "SO SO SO HAPPY WE FOUND YOU GUYS!!!! I'd bet you've saved me 100 hours so far.", by: "Jeremy, Product Manager at TimeWise", imgSrc: "https://i.pravatar.cc/150?img=6" },
  { id: 6, quote: "Took some convincing, but now that we're on COMPANY, we're never going back.", by: "Pam, Marketing Director at BrandBuilders", imgSrc: "https://i.pravatar.cc/150?img=7" },
  { id: 7, quote: "I would be lost without COMPANY's in-depth analytics. The ROI is EASILY 100X for us.", by: "Daniel, Data Scientist at AnalyticsPro", imgSrc: "https://i.pravatar.cc/150?img=8" },
  { id: 8, quote: "It's just the best. Period.", by: "Fernando, UX Designer at UserFirst", imgSrc: "https://i.pravatar.cc/150?img=9" },
  { id: 9, quote: "I switched 5 years ago and never looked back.", by: "Andy, DevOps Engineer at CloudMasters", imgSrc: "https://i.pravatar.cc/150?img=10" },
  { id: 10, quote: "I've been searching for a solution like COMPANY for YEARS. So glad I finally found one!", by: "Pete, Sales Director at RevenueRockets", imgSrc: "https://i.pravatar.cc/150?img=11" },
  { id: 11, quote: "It's so simple and intuitive, we got the team up to speed in 10 minutes.", by: "Marina, HR Manager at TalentForge", imgSrc: "https://i.pravatar.cc/150?img=12" },
  { id: 12, quote: "COMPANY's customer support is unparalleled. They're always there when we need them.", by: "Olivia, Customer Success Manager at ClientCare", imgSrc: "https://i.pravatar.cc/150?img=13" },
  { id: 13, quote: "The efficiency gains we've seen since implementing COMPANY are off the charts!", by: "Raj, Operations Manager at StreamlineSolutions", imgSrc: "https://i.pravatar.cc/150?img=14" },
  { id: 14, quote: "COMPANY has revolutionized how we handle our workflow. It's a game-changer!", by: "Lila, Workflow Specialist at ProcessPro", imgSrc: "https://i.pravatar.cc/150?img=15" },
  { id: 15, quote: "The scalability of COMPANY's solution is impressive. It grows with our business seamlessly.", by: "Trevor, Scaling Officer at GrowthGurus", imgSrc: "https://i.pravatar.cc/150?img=16" },
  { id: 16, quote: "I appreciate how COMPANY continually innovates. They're always one step ahead.", by: "Naomi, Innovation Lead at FutureTech", imgSrc: "https://i.pravatar.cc/150?img=17" },
  { id: 17, quote: "The ROI we've seen with COMPANY is incredible. It's paid for itself many times over.", by: "Victor, Finance Analyst at ProfitPeak", imgSrc: "https://i.pravatar.cc/150?img=18" },
  { id: 18, quote: "COMPANY's platform is so robust, yet easy to use. It's the perfect balance.", by: "Yuki, Tech Lead at BalancedTech", imgSrc: "https://i.pravatar.cc/150?img=19" },
  { id: 19, quote: "We've tried many solutions, but COMPANY stands out in terms of reliability and performance.", by: "Zoe, Performance Manager at ReliableSystems", imgSrc: "https://i.pravatar.cc/150?img=20" },
];

const AVATAR_FALLBACK = "from-saffron-400 to-maroon-600";

interface TestimonialCardProps {
  position: number;
  testimonial: StaggerTestimonial;
  handleMove: (steps: number) => void;
  cardSize: number;
  wasDragged: { current: boolean };
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
  wasDragged,
}) => {
  const isCenter = position === 0;

  return (
    <div
      onClick={() => {
        // A click landing right after a drag shouldn't also rotate.
        if (wasDragged.current) {
          wasDragged.current = false;
          return;
        }
        handleMove(position);
      }}
      className={cn(
        // Open palm on hover, closed fist while held — the deck is draggable.
        "absolute left-1/2 top-1/2 flex cursor-grab flex-col border-2 p-8 transition-all duration-500 ease-in-out will-change-transform active:cursor-grabbing",
        isCenter
          ? "z-10 bg-primary text-primary-foreground border-primary"
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50",
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter
          ? "0px 8px 0px 4px #FFDCA1"
          : "0px 0px 0px 0px transparent",
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />
      {testimonial.imgSrc ? (
        <img
          src={testimonial.imgSrc}
          alt={testimonial.by.split(",")[0]}
          className="mb-4 h-14 w-12 bg-muted object-cover object-top"
          style={{ boxShadow: "3px 3px 0px #FFFBF4" }}
        />
      ) : (
        <div
          className={cn(
            "mb-4 flex h-14 w-12 items-center justify-center bg-gradient-to-br text-sm font-bold text-white",
            testimonial.avatarColor ?? AVATAR_FALLBACK,
          )}
          style={{ boxShadow: "3px 3px 0px #FFFBF4" }}
        >
          {testimonial.avatar ?? testimonial.by.charAt(0).toUpperCase()}
        </div>
      )}
      <h3
        className={cn(
          "line-clamp-4 text-base leading-snug sm:text-xl sm:leading-snug font-medium",
          isCenter ? "text-primary-foreground" : "text-foreground",
        )}
      >
        "{testimonial.quote}"
      </h3>
      <p
        className={cn(
          "mt-auto pt-6 text-sm italic",
          isCenter ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        - {testimonial.by}
      </p>
    </div>
  );
};

interface StaggerTestimonialsProps {
  items?: StaggerTestimonial[];
  /** Height of the stage, any CSS length. */
  height?: number | string;
  className?: string;
}

export const StaggerTestimonials: React.FC<StaggerTestimonialsProps> = ({
  items = defaultItems,
  height = 600,
  className,
}) => {
  const [cardSize, setCardSize] = useState(365);
  const [list, setList] = useState<StaggerTestimonial[]>(items);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; lastX: number; moved: boolean } | null>(
    null,
  );
  const wasDraggedRef = useRef(false);

  // Keep the deck in sync if the items prop ever changes.
  useEffect(() => {
    setList(items);
  }, [items]);

  const handleMove = (steps: number) => {
    setList((prev) => {
      const next = [...prev];
      if (steps > 0) {
        for (let i = steps; i > 0; i--) {
          const item = next.shift();
          if (!item) return prev;
          next.push(item);
        }
      } else {
        for (let i = steps; i < 0; i++) {
          const item = next.pop();
          if (!item) return prev;
          next.unshift(item);
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)");
      setCardSize(matches ? 365 : 290);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // --- drag / swipe to move (no arrows) ---
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    wasDraggedRef.current = false;
    dragRef.current = { startX: e.clientX, lastX: e.clientX, moved: false };
    const el = containerRef.current;
    if (el) el.style.transition = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    d.lastX = e.clientX;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 8 && !d.moved) {
      d.moved = true;
      // Capture only once a real drag is detected, so a plain tap still
      // delivers its click to the card underneath.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic or inactive pointer — ignore */
      }
    }
    const el = containerRef.current;
    if (el) el.style.transform = `translateX(${dx}px)`;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    const el = containerRef.current;
    if (el) {
      el.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "translateX(0px)";
    }
    if (!d) return;
    wasDraggedRef.current = d.moved;
    const dx = d.lastX - d.startX;
    // A decisive swipe rotates the deck; small nudges snap back.
    if (d.moved && Math.abs(dx) > 40) {
      handleMove(dx > 0 ? -1 : 1);
    }
  };

  // Symmetric fan around a single centre card: -2, -1, 0, 1, 2 for five.
  // (The original formula leaned one card to the left — invisible with a
  // twenty-card deck, obvious with the site's handful of reviews.)
  const positionOf = (i: number) => i - Math.floor(list.length / 2);

  const centerIndex = list.findIndex((_, i) => positionOf(i) === 0);
  const centerItem = list[centerIndex] ?? list[0];

  return (
    <div
      role="region"
      aria-label="Devotee testimonials carousel"
      className={cn(
        "relative w-full touch-pan-y select-none overflow-hidden",
        className,
      )}
      style={{ height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      >
        {list.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.id}
            testimonial={testimonial}
            handleMove={handleMove}
            position={positionOf(index)}
            cardSize={cardSize}
            wasDragged={wasDraggedRef}
          />
        ))}
      </div>

      {/* Screen-reader announcement of the centre testimonial */}
      <p aria-live="polite" className="sr-only">
        {centerItem ? `Current testimonial by ${centerItem.by}` : ""}
      </p>
    </div>
  );
};
