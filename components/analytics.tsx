import Script from "next/script";

import type { PublicSiteSettings } from "@/lib/portfolio-data";

export function PortfolioAnalytics({ settings }: { settings: PublicSiteSettings }) {
  if (process.env.NODE_ENV !== "production" || !settings.analyticsEnabled || !settings.analyticsId) {
    return null;
  }

  const provider = settings.analyticsProvider.trim().toLowerCase();

  if (provider === "google" || provider === "ga4") {
    const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(settings.analyticsId)}`;
    const analyticsId = JSON.stringify(settings.analyticsId);

    return (
      <>
        <Script src={src} strategy="afterInteractive" />
        <Script id="portfolio-ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', ${analyticsId});
          `}
        </Script>
      </>
    );
  }

  if (provider === "plausible") {
    return <Script defer data-domain={settings.analyticsId} src="https://plausible.io/js/script.js" strategy="afterInteractive" />;
  }

  if (provider === "umami") {
    const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

    if (!scriptUrl) {
      return null;
    }

    return <Script defer src={scriptUrl} data-website-id={settings.analyticsId} strategy="afterInteractive" />;
  }

  return null;
}
