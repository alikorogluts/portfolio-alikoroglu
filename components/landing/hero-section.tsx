"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const fallbackWords = ["build", "ship", "detect", "scale"];

function BlurWord({ word, trigger }: { word: string; trigger: number }) {
  const letters = word.split("");
  const STAGGER = 45;      // ms between each letter
  const DURATION = 500;    // blur+opacity fade duration per letter
  const GRADIENT_HOLD = STAGGER * letters.length + DURATION + 200;

  const [letterStates, setLetterStates] = useState<{ opacity: number; blur: number }[]>(
    letters.map(() => ({ opacity: 0, blur: 20 }))
  );
  const [showGradient, setShowGradient] = useState(true);
  const framesRef = useRef<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // reset
    framesRef.current.forEach(cancelAnimationFrame);
    timersRef.current.forEach(clearTimeout);
    framesRef.current = [];
    timersRef.current = [];

    setLetterStates(letters.map(() => ({ opacity: 0, blur: 20 })));
    setShowGradient(true);

    // stagger each letter
    letters.forEach((_, i) => {
      const t = setTimeout(() => {
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setLetterStates(prev => {
            const next = [...prev];
            next[i] = { opacity: eased, blur: 20 * (1 - eased) };
            return next;
          });
          if (progress < 1) {
            const id = requestAnimationFrame(tick);
            framesRef.current.push(id);
          }
        };
        const id = requestAnimationFrame(tick);
        framesRef.current.push(id);
      }, i * STAGGER);
      timersRef.current.push(t);
    });

    // remove gradient once all letters are settled
    const gt = setTimeout(() => setShowGradient(false), GRADIENT_HOLD);
    timersRef.current.push(gt);

    return () => {
      framesRef.current.forEach(cancelAnimationFrame);
      timersRef.current.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  // gradient colours cycling across letter positions
  const gradientColors = ["#eca8d6", "#a78bfa", "#67e8f9", "#fbbf24", "#eca8d6"];

  return (
    <>
      {letters.map((char, i) => {
        const colorIndex = (i / Math.max(letters.length - 1, 1)) * (gradientColors.length - 1);
        const lower = Math.floor(colorIndex);
        const upper = Math.min(lower + 1, gradientColors.length - 1);
        const t = colorIndex - lower;

        // lerp hex colours
        const hex2rgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return [r, g, b];
        };
        const [r1, g1, b1] = hex2rgb(gradientColors[lower]);
        const [r2, g2, b2] = hex2rgb(gradientColors[upper]);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: letterStates[i]?.opacity ?? 0,
              filter: `blur(${letterStates[i]?.blur ?? 20}px)`,
              color: showGradient ? `rgb(${r},${g},${b})` : "white",
              transition: "color 0.4s ease",
            }}
          >
            {char}
          </span>
        );
      })}
    </>
  );
}

type Profile = {
  name: string;
  role: string;
  subtitle: string;
  summary: string;
  stackLine: string;
  availability: string;
};

type Hero = {
  headlinePrefix: string;
  headlineTemplate: string;
  animatedWords: string[];
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  currentBuilding: string;
  backgroundImageUrl: string;
};

type Settings = {
  showAvailabilityBadge: boolean;
};

export function HeroSection({
  profile: profileData,
  hero,
  settings,
}: {
  profile: Profile;
  hero?: Hero;
  settings: Settings;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const words = hero?.animatedWords?.length ? hero.animatedWords : fallbackWords;
  const longestWordLength = Math.max(...words.map((word) => word.length), 1);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="profile" className="relative min-h-screen flex flex-col justify-center items-start overflow-hidden bg-black">
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        {hero?.backgroundImageUrl ? (
          <img src={hero.backgroundImageUrl} alt="" aria-hidden="true" className="w-full h-full object-cover object-center opacity-80" />
        ) : (
          <video
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            className="w-full h-full object-cover object-center opacity-80"
          >
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4" type="video/mp4" />
          </video>
        )}
        {/* Subtle overlay to ensure text readability on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Subtle grid lines */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-white/10"
            style={{
              top: `${12.5 * (i + 1)}%`,
              left: 0,
              right: 0,
            }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-white/10"
            style={{
              left: `${8.33 * (i + 1)}%`,
              top: 0,
              bottom: 0,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-32 lg:px-12 lg:py-40 max-sm:py-28 max-sm:pb-10">
        <div className="max-w-5xl lg:max-w-[68%]">
        {/* Eyebrow */}
        {settings.showAvailabilityBadge ? (
        <div
          className={`mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-white/60">
              <span className="w-8 h-px bg-white/30" />
              {profileData.availability}
            </span>
        </div>
        ) : null}
        
        {/* Main headline */}
        <div className="mb-12">
          <h1
            className={`text-left text-[clamp(2.75rem,7vw,7rem)] font-display leading-[0.92] tracking-tight text-white transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="block">{hero?.headlinePrefix ?? profileData.name}</span>
            <span className="block max-w-full md:whitespace-nowrap">
              {hero?.headlineTemplate ?? "systems that"}{" "}
              <span
                className="relative inline-block whitespace-nowrap align-baseline"
                style={{ minWidth: `${longestWordLength}ch` }}
              >
                <BlurWord word={words[wordIndex]} trigger={wordIndex} />
              </span>
            </span>
          </h1>
        </div>
        <div
          className={`max-w-2xl transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="text-xl lg:text-2xl text-white/70 leading-relaxed mb-5 max-sm:text-lg max-sm:leading-8">
            {hero?.description ?? `${profileData.role} | ${profileData.subtitle}. ${profileData.summary}`}
          </p>
          <p className="text-sm font-mono text-white/50 leading-relaxed max-sm:text-xs max-sm:leading-6">
            {profileData.stackLine}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center max-sm:mt-6">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full border border-white/15 bg-white/[0.08] px-8 text-base text-white hover:bg-white/[0.12] max-sm:w-full max-sm:justify-center"
            >
              <a href={hero?.primaryCtaHref ?? "#contact"}>
                {hero?.primaryCtaLabel ?? "Email me"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 rounded-full border-white/15 bg-white/[0.02] px-8 text-base text-white hover:bg-white/[0.08] hover:text-white max-sm:w-full max-sm:justify-center"
            >
              <a href={hero?.secondaryCtaHref ?? "#projects"}>{hero?.secondaryCtaLabel ?? "View GitHub"}</a>
            </Button>
          </div>
        </div>
        </div>
      </div>
      
      {/* Stats — 3 metrics static, no auto-scroll */}
      <div 
        className={`absolute bottom-12 left-0 right-0 px-6 lg:px-12 transition-all duration-700 delay-500 max-sm:static max-sm:px-6 max-sm:pb-8 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-start gap-8 lg:gap-20 max-sm:grid max-sm:grid-cols-2 max-sm:gap-4">
          {[
            { value: hero?.currentBuilding ?? "DeepSecure", label: "currently building" },
            { value: "6th", label: "Teknofest 2024 in Turkey" },
            { value: "2", label: "industry internships" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2 min-w-0">
              <span className="text-3xl lg:text-4xl font-display text-white break-words max-sm:text-2xl max-sm:leading-none">{stat.value}</span>
              <span className="text-xs text-white/50 leading-tight max-sm:text-[11px]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}

    </section>
  );
}
