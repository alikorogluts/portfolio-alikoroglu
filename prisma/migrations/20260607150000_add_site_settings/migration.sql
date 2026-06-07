-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "siteTitle" TEXT NOT NULL DEFAULT 'Ali Koroglu - Full-Stack & Mobile Developer',
    "siteDescription" TEXT NOT NULL DEFAULT 'Portfolio of Ali Koroglu, a computer engineering senior building .NET, Next.js, Flutter, and Python ML systems.',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "showAvailabilityBadge" BOOLEAN NOT NULL DEFAULT true,
    "showDownloadCvButton" BOOLEAN NOT NULL DEFAULT true,
    "showGithubButton" BOOLEAN NOT NULL DEFAULT true,
    "showEmailButton" BOOLEAN NOT NULL DEFAULT true,
    "contactFormEnabled" BOOLEAN NOT NULL DEFAULT true,
    "contactRecipientEmail" TEXT,
    "footerCopyrightText" TEXT,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "analyticsProvider" TEXT,
    "analyticsId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
