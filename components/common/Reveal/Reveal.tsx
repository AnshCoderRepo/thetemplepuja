"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  initialVisible?: boolean;
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
  initialVisible = false,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(initialVisible);

  useEffect(() => {
    if (initialVisible) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [initialVisible]);

  const Component = as;

  if (initialVisible) {
    return (
      <Component ref={ref as any} className={`opacity-100 translate-y-0 ${className}`}>
        {children}
      </Component>
    );
  }

  return (
    <Component
      ref={ref as any}
      style={{
        transitionDelay: `${delay}ms`,
        animationDelay: `${delay}ms`,
      }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none"
      } ${className}`}
    >
      {children}
    </Component>
  );
}
