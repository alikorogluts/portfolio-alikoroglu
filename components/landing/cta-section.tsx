"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { profile } from "./portfolio-data";

export function CtaSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden bg-black">
      <div className="absolute inset-x-0 top-0 h-px bg-foreground/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-black to-black pointer-events-none" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div
          className={`relative transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="absolute right-0 top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-[#eca8d6]/[0.035] blur-[120px] lg:block" />
          
          <div className="relative z-10">
            <div className="grid lg:grid-cols-12 items-center gap-12 lg:gap-16">
              {/* Left content */}
              <div className="lg:col-span-6">
                <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
                  <span className="w-12 h-px bg-foreground/20" />
                  Contact
                </span>

                <h2 className="text-6xl md:text-7xl lg:text-[96px] font-display tracking-tight mb-8 leading-[0.92]">
                  Let&apos;s build
                  <br />
                  <span className="text-muted-foreground">what matters.</span>
                </h2>

                <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-xl">
                  Open to internship, backend, full-stack, and mobile opportunities where distributed systems, real-time products, and practical engineering matter.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-foreground/[0.08] hover:bg-foreground/[0.12] border border-foreground/15 text-foreground px-8 h-14 text-base rounded-full group"
                  >
                    <a href={`mailto:${profile.email}`}>
                      Email me
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-base rounded-full border-foreground/15 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06]"
                  >
                    <a href={profile.github}>View GitHub</a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-base rounded-full border-foreground/15 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06]"
                  >
                    <a href={profile.cv}>Download CV</a>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground mt-8 font-mono">
                  {profile.email} · {profile.location}
                </p>
              </div>

              {/* Right image */}
              <div className="hidden lg:col-span-6 lg:flex items-end justify-center h-[620px] -mr-16">
                <img
                  src="/images/bridge.png"
                  alt="Two trees connected by glowing arcs"
                  className="w-full h-full object-contain object-bottom"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
