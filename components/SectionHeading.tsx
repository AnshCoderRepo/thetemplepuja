import Reveal from "./Reveal";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
  center?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  dark = false,
  center = true,
}: SectionHeadingProps) {
  return (
    <Reveal className={`mb-14 ${center ? "text-center" : ""}`}>
      <span
        className={`eyebrow ${
          dark
            ? "border-saffron-400/30 bg-white/10 text-saffron-300"
            : ""
        }`}
      >
        <span className="text-saffron-500">🪔</span>
        {eyebrow}
      </span>
      <h2
        className={`font-display text-3xl font-bold leading-tight sm:text-4xl md:text-5xl ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            center ? "mx-auto max-w-2xl" : ""
          } ${dark ? "text-saffron-100/70" : "text-ink-soft"}`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
