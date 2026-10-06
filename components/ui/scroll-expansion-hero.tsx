"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
} from "react";
import Image from "next/image";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);
  const [inView, setInView] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isSectionAtTop = (): boolean => {
    const el = sectionRef.current;
    if (!el) return false;
    return el.getBoundingClientRect().top <= 8;
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!inView) return;
      if (mediaFullyExpanded && e.deltaY < 0 && isSectionAtTop()) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!inView) return;
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!inView) return;
      if (!touchStartYRef.current) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;

      if (mediaFullyExpanded && deltaY < -20 && isSectionAtTop()) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        touchStartYRef.current = touchY;
      }
    };

    const handleTouchEnd = (): void => {
      touchStartYRef.current = 0;
    };

    const handleScroll = (): void => {
      if (inView && !mediaFullyExpanded && sectionRef.current) {
        const top =
          sectionRef.current.getBoundingClientRect().top + window.scrollY;
        if (Math.abs(window.scrollY - top) > 1) {
          window.scrollTo(0, top);
        }
      }
    };

    window.addEventListener("wheel", handleWheel as unknown as EventListener, {
      passive: false,
    });
    window.addEventListener("scroll", handleScroll as EventListener);
    window.addEventListener(
      "touchstart",
      handleTouchStart as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener(
      "touchmove",
      handleTouchMove as unknown as EventListener,
      { passive: false }
    );
    window.addEventListener("touchend", handleTouchEnd as EventListener);

    return () => {
      window.removeEventListener(
        "wheel",
        handleWheel as unknown as EventListener
      );
      window.removeEventListener("scroll", handleScroll as EventListener);
      window.removeEventListener(
        "touchstart",
        handleTouchStart as unknown as EventListener
      );
      window.removeEventListener(
        "touchmove",
        handleTouchMove as unknown as EventListener
      );
      window.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [scrollProgress, mediaFullyExpanded, inView]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const titleWords = title ? title.split(" ") : [];
  const firstWord = titleWords[0] || "";
  const restOfTitle = titleWords.slice(1).join(" ");

  return (
    <div
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-start bg-cream overflow-hidden"
    >
      <section className="relative flex min-h-screen w-full flex-col items-center justify-start">
        <div className="relative flex min-h-screen w-full flex-col items-center justify-start">
          <div className="absolute inset-0 z-0 h-full w-full">
            <Image
              src={bgImageSrc}
              alt="Background image"
              fill
              className="h-full w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>

          <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-start">
            <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center">
              <div
                className="relative z-10 flex flex-col items-center justify-center rounded-2xl shadow-2xl transition-all duration-100"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: "95vw",
                  maxHeight: "85vh",
                }}
              >
                {mediaType === "video" ? (
                  posterSrc ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={posterSrc}
                        alt={title || "Video poster"}
                        fill
                        className="h-full w-full rounded-2xl object-cover"
                      />
                      <div
                        className="absolute inset-0 rounded-2xl bg-black transition-opacity duration-200"
                        style={{ opacity: 0.5 - scrollProgress * 0.3 }}
                      />
                    </div>
                  ) : (
                    <div className="relative h-full w-full">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full rounded-2xl object-cover"
                      />
                      <div
                        className="absolute inset-0 rounded-2xl bg-black transition-opacity duration-200"
                        style={{ opacity: 0.5 - scrollProgress * 0.3 }}
                      />
                    </div>
                  )
                ) : (
                  <div className="relative h-full w-full">
                    <Image
                      src={mediaSrc}
                      alt={title || "Media content"}
                      width={1280}
                      height={720}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                    <div
                      className="absolute inset-0 rounded-2xl bg-black transition-opacity duration-200"
                      style={{ opacity: 0.7 - scrollProgress * 0.3 }}
                    />
                  </div>
                )}

                <div className="relative z-10 mt-4 flex flex-col items-center text-center">
                  {date && (
                    <p
                      className="text-2xl text-saffron-200 font-display"
                      style={{ transform: `translateX(-${textTranslateX}vw)` }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="text-center font-semibold text-saffron-100 text-xs tracking-wider uppercase mt-1"
                      style={{ transform: `translateX(${textTranslateX}vw)` }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`relative z-10 flex w-full flex-col items-center justify-center gap-2 text-center mt-4 ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                <h2
                  className="font-display text-4xl font-extrabold text-saffron-100 md:text-5xl lg:text-6xl transition-transform"
                  style={{ transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </h2>
                <h2
                  className="font-display text-center text-4xl font-extrabold text-white md:text-5xl lg:text-6xl transition-transform"
                  style={{ transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </h2>
              </div>
            </div>

            <section
              className="flex w-full flex-col px-8 py-10 md:px-16 lg:py-20 transition-opacity duration-500"
              style={{ opacity: showContent ? 1 : 0 }}
            >
              {children}
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
