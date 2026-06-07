-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_SUCCESS';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_FAILED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BACKUP_CODE_USED';

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "twoFactorEnabledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AdminBackupCode" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminBackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminBackupCode_adminId_idx" ON "AdminBackupCode"("adminId");

-- AddForeignKey
ALTER TABLE "AdminBackupCode" ADD CONSTRAINT "AdminBackupCode_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
