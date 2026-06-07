"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Profile = {
  email: string;
  github: string;
  cv: string;
  location: string;
};

type Settings = {
  showDownloadCvButton: boolean;
  showGithubButton: boolean;
  showEmailButton: boolean;
  contactFormEnabled: boolean;
};

export function CtaSection({ profile: profileData, settings }: { profile: Profile; settings: Settings }) {
  const [isVisible, setIsVisible] = useState(false);
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      subject: String(formData.get("subject") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };
    const errors: Record<string, string> = {};

    if (values.name.length < 2) errors.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Enter a valid email.";
    if (values.message.length < 10) errors.message = "Message must be at least 10 characters.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormState("error");
      return;
    }

    setFieldErrors({});
    setFormState("submitting");
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
      }),
    });

    if (!response.ok) {
      setFormState("error");
      return;
    }

    form.reset();
    setFormState("success");
  }

  const inputClass = (field: string) =>
    `border-foreground/10 bg-black/30 text-foreground placeholder:text-muted-foreground ${
      fieldErrors[field] ? "border-red-400/60 focus-visible:ring-red-400/30" : ""
    }`;

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
                  {settings.showEmailButton ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-foreground/[0.08] hover:bg-foreground/[0.12] border border-foreground/15 text-foreground px-8 h-14 text-base rounded-full group"
                  >
                    <a href={`mailto:${profileData.email}`}>
                      Email me
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </a>
                  </Button>
                  ) : null}
                  {settings.showGithubButton ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-base rounded-full border-foreground/15 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06]"
                  >
                    <a href={profileData.github}>View GitHub</a>
                  </Button>
                  ) : null}
                  {settings.showDownloadCvButton ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-base rounded-full border-foreground/15 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06]"
                  >
                    <a href={profileData.cv}>Download CV</a>
                  </Button>
                  ) : null}
                </div>

                <p className="text-sm text-muted-foreground mt-8 font-mono">
                  {[settings.showEmailButton ? profileData.email : null, profileData.location].filter(Boolean).join(" · ")}
                </p>
              </div>

              {/* Right image */}
              <div className="lg:col-span-6">
                {settings.contactFormEnabled ? (
                <form
                  onSubmit={handleSubmit}
                  className="relative overflow-hidden border border-foreground/10 bg-foreground/[0.025] p-6 lg:p-8"
                >
                  <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#eca8d6]/10 blur-[70px]" />
                  <div className="relative grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        name="name"
                        placeholder="Name"
                        aria-invalid={Boolean(fieldErrors.name)}
                        className={inputClass("name")}
                      />
                      {fieldErrors.name ? <p className="text-xs text-red-300 sm:col-span-1">{fieldErrors.name}</p> : null}
                      <Input
                        name="email"
                        type="email"
                        placeholder="Email"
                        aria-invalid={Boolean(fieldErrors.email)}
                        className={inputClass("email")}
                      />
                      {fieldErrors.email ? <p className="text-xs text-red-300 sm:col-span-1">{fieldErrors.email}</p> : null}
                    </div>
                    <Input
                      name="subject"
                      placeholder="Subject (optional)"
                      className={inputClass("subject")}
                    />
                    <Textarea
                      name="message"
                      placeholder="Message"
                      aria-invalid={Boolean(fieldErrors.message)}
                      className={`min-h-36 ${inputClass("message")}`}
                    />
                    {fieldErrors.message ? <p className="text-xs text-red-300">{fieldErrors.message}</p> : null}
                    <Button
                      type="submit"
                      disabled={formState === "submitting"}
                      size="lg"
                      className="h-14 rounded-full border border-foreground/15 bg-foreground/[0.08] px-8 text-base text-foreground hover:bg-foreground/[0.12]"
                    >
                      {formState === "submitting" ? "Sending..." : "Send message"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    {formState === "success" ? (
                      <p className="text-sm text-[#eca8d6]">Message sent successfully. I will get back to you soon.</p>
                    ) : null}
                    {formState === "error" ? (
                      <p className="text-sm text-red-300">Could not send your message. Please check the required fields and try again.</p>
                    ) : null}
                  </div>
                </form>
                ) : (
                  <div className="relative overflow-hidden border border-foreground/10 bg-foreground/[0.025] p-6 lg:p-8">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#eca8d6]/10 blur-[70px]" />
                    <p className="relative text-sm leading-6 text-muted-foreground">
                      The contact form is currently disabled. Please use the available contact links.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
