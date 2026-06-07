import { requireAdmin } from "@/lib/auth";

import { AdminHeader, AdminSidebar } from "./admin-nav";

type AdminShellProps = {
  children: React.ReactNode;
  title: string;
  description?: string;
};

export async function AdminShell({ children, title, description }: AdminShellProps) {
  const user = await requireAdmin();

  return (
    <main className="min-h-screen overflow-hidden bg-[#030304] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(120,119,198,0.14),transparent_28%),radial-gradient(circle_at_20%_82%,rgba(45,212,191,0.08),transparent_30%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,auto,36px_36px,36px_36px]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(3,3,4,0.2),#030304_78%)]" />

      <AdminSidebar email={user.email} role={user.role} />
      <AdminHeader email={user.email} role={user.role} />

      <section className="relative w-full px-4 py-7 sm:px-6 lg:ml-72 lg:max-w-[calc(100vw-18rem)] lg:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Admin</p>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.01em] md:text-4xl">{title}</h1>
            {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">{description}</p> : null}
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
