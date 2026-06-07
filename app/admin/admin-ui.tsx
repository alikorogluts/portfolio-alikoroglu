import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/[0.045] text-white/70",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  danger: "border-red-400/20 bg-red-400/10 text-red-200",
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <SectionCard className="relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/45">{label}</p>
          <p className="mt-3 text-2xl font-medium tracking-[-0.01em] text-white">{value}</p>
          <p className="mt-2 text-xs leading-5 text-white/38">{description}</p>
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md border", toneStyles[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </SectionCard>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <SectionCard className="flex min-h-64 flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-white/55">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-lg font-medium text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-white/45">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </SectionCard>
  );
}

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs", toneStyles[tone])}>{children}</span>;
}

export function MiniBarChart({ values, tone = "neutral" }: { values: Array<{ label: string; value: number }>; tone?: Tone }) {
  const maxValue = Math.max(...values.map((item) => item.value), 1);
  const barColor = {
    neutral: "bg-white/65",
    success: "bg-emerald-300/75",
    warning: "bg-amber-300/75",
    danger: "bg-red-300/75",
  }[tone];

  return (
    <div className="flex h-32 items-end gap-2">
      {values.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex h-24 w-full items-end rounded-sm bg-white/[0.035]">
            <div
              className={cn("w-full rounded-sm", barColor)}
              style={{ height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 4)}%` }}
            />
          </div>
          <span className="max-w-full truncate text-[10px] text-white/35">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
