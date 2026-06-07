type MaintenanceSettings = {
  maintenanceTitle: string;
  maintenanceDescription: string;
  maintenanceExpectedBackAt: string;
  maintenanceImageUrl: string;
};

export function MaintenancePage({ settings }: { settings: MaintenanceSettings }) {
  const imageUrl = settings.maintenanceImageUrl || "/images/maintenance-visual.png";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(236,168,214,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(103,232,249,0.1),transparent_24%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black to-black" />
      <div className="absolute inset-0 opacity-15">
        <div className="h-full w-full bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <section className="relative z-10 flex min-h-screen items-center px-6 py-24 lg:px-12">
        <div className="pointer-events-none absolute inset-y-0 right-[-20vw] z-0 flex w-[110vw] items-center justify-center opacity-25 sm:right-[-24vw] lg:right-[-7vw] lg:w-[58vw] lg:opacity-80">
          <div className="absolute aspect-square w-[72vw] max-w-[760px] rounded-full bg-[#7c3aed]/20 blur-[120px] lg:w-[46vw]" />
          <div className="absolute aspect-square w-[56vw] max-w-[620px] rounded-full bg-[#eca8d6]/18 blur-[95px] lg:w-[38vw]" />
          <img
            src={imageUrl}
            alt=""
            className="relative h-auto w-[82vw] max-w-[780px] object-contain opacity-75 mix-blend-screen [mask-image:radial-gradient(ellipse_at_center,black_0%,black_34%,rgba(0,0,0,0.68)_52%,transparent_76%)] lg:w-[48vw]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1400px]">
          <div className="max-w-4xl">
            <span className="mb-8 inline-flex items-center gap-3 text-sm font-mono text-white/55">
              <span className="h-px w-12 bg-white/25" />
              Maintenance mode
            </span>
            <h1 className="max-w-4xl text-6xl font-display leading-[0.9] tracking-tight md:text-7xl lg:text-[120px]">
              {settings.maintenanceTitle}
            </h1>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-white/62">
              {settings.maintenanceDescription}
            </p>
            {settings.maintenanceExpectedBackAt ? (
              <p className="mt-6 text-sm font-mono text-white/45">
                Expected back: {settings.maintenanceExpectedBackAt}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes maintenancePulse {
          0%, 100% { transform: scale(0.96); opacity: 0.62; }
          50% { transform: scale(1.02); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
