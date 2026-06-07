import { Suspense } from "react";
import { LockKeyhole } from "lucide-react";

import { AdminLoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#030304] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(148,163,184,0.16),transparent_34%),radial-gradient(circle_at_28%_72%,rgba(71,85,105,0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-20">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-white/55">
              <LockKeyhole className="h-3.5 w-3.5" />
              Secure Admin
            </div>
            <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
              Ali Koroglu
              <span className="block text-white/45">Portfolio Control</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/55 md:text-base">
              Protected access for portfolio content operations and future editorial workflows.
            </p>
          </div>

          <Suspense fallback={<div className="h-[356px] rounded-lg border border-white/10 bg-white/[0.035]" />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
