ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MESSAGE_UNREAD';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MESSAGE_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MEDIA_DELETED';

CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'DOCUMENT');

ALTER TABLE "SiteSettings"
  ADD COLUMN "maintenanceTitle" TEXT,
  ADD COLUMN "maintenanceDescription" TEXT,
  ADD COLUMN "maintenanceExpectedBackAt" TEXT,
  ADD COLUMN "maintenanceImageUrl" TEXT,
  ADD COLUMN "ogImageUrl" TEXT;

ALTER TABLE "PortfolioHero"
  ADD COLUMN "backgroundImageUrl" TEXT,
  ADD COLUMN "visualImageUrl" TEXT;

ALTER TABLE "PortfolioProject"
  ADD COLUMN "spotlightTitle" TEXT,
  ADD COLUMN "spotlightSubtitle" TEXT,
  ADD COLUMN "spotlightDescription" TEXT,
  ADD COLUMN "spotlightImageUrl" TEXT,
  ADD COLUMN "spotlightMetricLabel" TEXT,
  ADD COLUMN "spotlightMetricValue" TEXT;

ALTER TABLE "ContactMessage"
  ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "AdminMediaAsset" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "kind" "MediaKind" NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminMediaAsset_url_key" ON "AdminMediaAsset"("url");
CREATE INDEX "AdminMediaAsset_kind_idx" ON "AdminMediaAsset"("kind");
CREATE INDEX "AdminMediaAsset_uploadedById_idx" ON "AdminMediaAsset"("uploadedById");
CREATE INDEX "AdminMediaAsset_createdAt_idx" ON "AdminMediaAsset"("createdAt");
CREATE INDEX "ContactMessage_archivedAt_idx" ON "ContactMessage"("archivedAt");

ALTER TABLE "AdminMediaAsset"
  ADD CONSTRAINT "AdminMediaAsset_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
