"use client";

import { useEffect, useState, useRef } from "react";
import { ExternalLink, Github } from "lucide-react";

import { Button } from "@/components/ui/button";

type ProjectItem = {
  name: string;
  label: string;
  description: string;
  stack: string;
  metric: string;
  githubUrl?: string;
  demoUrl?: string;
  coverImageUrl?: string;
  spotlightTitle?: string;
  spotlightSubtitle?: string;
  spotlightDescription?: string;
  spotlightImageUrl?: string;
  spotlightMetricLabel?: string;
  spotlightMetricValue?: string;
  isFeatured?: boolean;
};

const regions = [
  { name: "Backend", nodes: 4, status: ".NET" },
  { name: "Frontend", nodes: 3, status: "Next.js" },
  { name: "ML Worker", nodes: 4, status: "Python" },
  { name: "Messaging", nodes: 1, status: "RabbitMQ" },
];

export function InfrastructureSection({ projects: projectItems }: { projects: ProjectItem[] }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeRegion, setActiveRegion] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const spotlightProject = projectItems.find((project) => project.isFeatured) ?? projectItems[0];
  const displayProjects = projectItems.filter((project) => project !== spotlightProject);
  const spotlightTitle = spotlightProject?.spotlightTitle || spotlightProject?.name;
  const spotlightSubtitle = spotlightProject?.spotlightSubtitle || spotlightProject?.label || "spotlight.";
  const spotlightDescription = spotlightProject?.spotlightDescription || spotlightProject?.description;
  const spotlightImage = spotlightProject?.spotlightImageUrl || spotlightProject?.coverImageUrl;
  const spotlightMetricValue = spotlightProject?.spotlightMetricValue || spotlightProject?.metric || "ML";
  const spotlightMetricLabel = spotlightProject?.spotlightMetricLabel || "spotlight";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRegion((prev) => (prev + 1) % regions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="projects" ref={sectionRef} className="relative py-32 lg:py-40 overflow-hidden">
        {/* Background accent — retiré, remplacé par l'image sphère */}
      
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        {spotlightProject ? (
        <div className="mb-20">
          <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}>
            <span className="w-12 h-px bg-foreground/20" />
            Featured projects
          </span>
          
          <div className="grid lg:grid-cols-[auto_1fr] gap-8 lg:gap-16 items-stretch">
            {/* Image globe — colonne gauche, pleine hauteur */}
            <div className={`w-48 lg:w-72 xl:w-80 shrink-0 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/world-3i68QNWJwmO7W19ztZWbevAwJQHzYL.png"
                alt="Global network sphere"
                className="w-full h-full object-contain object-center"
              />
            </div>

            {/* Titre + description empilés */}
            <div className="flex flex-col justify-center">
              <h2 className={`text-[clamp(3.5rem,9vw,8rem)] font-display tracking-tight leading-[0.9] transition-all duration-1000 break-words ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}>
                {spotlightTitle}
                <br />
                <span className="text-muted-foreground">{spotlightSubtitle}</span>
              </h2>

              <p className={`mt-8 text-xl text-muted-foreground leading-relaxed max-w-lg transition-all duration-1000 delay-100 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}>
                {spotlightDescription}
              </p>
              <ProjectLinks project={spotlightProject} className="mt-8" />
            </div>
          </div>
        </div>
        ) : null}

        {/* Main content grid */}
        {spotlightProject ? (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Large stat card */}
          <div className={`lg:col-span-2 relative p-8 lg:p-12 border border-foreground/10 bg-foreground/[0.02] overflow-hidden transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}>
            {/* Animated dots background with connecting lines */}
            <div className="absolute inset-0 opacity-70">
              {/* SVG for connecting lines */}
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: "none" }}
              >
                <defs>
                  <style>{`
                    @keyframes drawLine {
                      0%   { stroke-dashoffset: 1000; opacity: 0; }
                      15%  { opacity: 1; }
                      70%  { opacity: 0.7; }
                      100% { stroke-dashoffset: 0; opacity: 0; }
                    }
                    .connecting-line {
                      stroke: #eca8d6;
                      stroke-width: 1.2;
                      fill: none;
                      stroke-dasharray: 1000;
                      animation: drawLine 3s ease-in-out infinite;
                    }
                  `}</style>
                </defs>
                {[...Array(19)].map((_, i) => {
                  const x1 = 10 + (i % 5) * 20;
                  const y1 = 10 + Math.floor(i / 5) * 25;
                  const x2 = 10 + ((i + 1) % 5) * 20;
                  const y2 = 10 + Math.floor((i + 1) / 5) * 25;
                  return (
                    <line
                      key={`line-${i}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      className="connecting-line"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  );
                })}
              </svg>

              {/* Dots */}
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-[#eca8d6]"
                  style={{
                    left: `${10 + (i % 5) * 20}%`,
                    top: `${10 + Math.floor(i / 5) * 25}%`,
                    animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              <ProjectCover
                src={spotlightImage}
                alt={`${spotlightProject.name} cover`}
                className="mb-8 max-h-72 w-full object-cover"
              />
              <div className="flex flex-wrap items-baseline gap-2 mb-4">
                <span className="text-5xl lg:text-7xl font-display leading-none break-words">
                  {spotlightMetricValue}
                </span>
                <span className="text-2xl text-muted-foreground">{spotlightMetricLabel}</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                {spotlightProject.stack}
              </p>
            </div>
          </div>

          {/* Stacked stat cards */}
          <div className="flex flex-col gap-6">
            <div className={`p-8 border border-foreground/10 bg-foreground/[0.02] transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              <span className="text-5xl lg:text-6xl font-display">CNN</span>
              <span className="block text-sm text-muted-foreground mt-2">confidence scoring</span>
            </div>
            
            <div className={`p-8 border border-foreground/10 bg-foreground/[0.02] transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}>
              <span className="text-5xl lg:text-6xl font-display">FFT</span>
              <span className="block text-sm text-muted-foreground mt-2">anomaly detection</span>
            </div>
          </div>
        </div>
        ) : null}

        {/* Region list */}
        <div className={`mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          {regions.map((region, index) => (
            <div
              key={region.name}
              className={`p-6 border transition-all duration-300 cursor-default ${
                activeRegion === index 
                  ? "border-foreground/30 bg-foreground/[0.04]" 
                  : "border-foreground/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full transition-colors ${
                  activeRegion === index ? "bg-[#eca8d6]" : "bg-foreground/20"
                }`} />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  {region.status}
                </span>
              </div>
              <span className="font-medium block mb-1">{region.name}</span>
              <span className="text-sm text-muted-foreground">{region.nodes} CV-backed items</span>
            </div>
          ))}
        </div>
        <div className={`mt-12 grid md:grid-cols-2 gap-4 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}>
          {displayProjects.map((project) => (
            <div key={project.name} className="p-6 lg:p-8 border border-foreground/10 bg-foreground/[0.02]">
              <ProjectCover src={project.coverImageUrl} alt={`${project.name} cover`} className="mb-5 aspect-video w-full object-cover" />
              <span className="text-xs font-mono text-muted-foreground">{project.label}</span>
              <h3 className="text-2xl lg:text-3xl font-display mt-3 mb-4">{project.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{project.description}</p>
              <p className="text-xs font-mono text-muted-foreground">{project.stack}</p>
              <ProjectLinks project={project} className="mt-6" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectLinks({ project, className = "" }: { project: ProjectItem; className?: string }) {
  if (!project.githubUrl && !project.demoUrl) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {project.githubUrl ? (
        <Button asChild size="sm" variant="outline" className="border-foreground/15 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06]">
          <a href={project.githubUrl} target="_blank" rel="noreferrer">
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </a>
        </Button>
      ) : null}
      {project.demoUrl ? (
        <Button asChild size="sm" className="border border-foreground/15 bg-foreground/[0.08] text-foreground hover:bg-foreground/[0.12]">
          <a href={project.demoUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Demo
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function ProjectCover({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return null;

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
