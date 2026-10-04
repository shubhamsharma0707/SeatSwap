/*
  Warnings:

  - Added the required column `expires_at` to the `email_outbox` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OutboxStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "email_outbox" ADD COLUMN     "expires_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "manual_retry_count" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "email_outbox_status_expires_at_idx" ON "email_outbox"("status", "expires_at");
