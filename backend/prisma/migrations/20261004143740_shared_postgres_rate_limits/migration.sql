-- CreateTable
CREATE TABLE "rate_limit_counters" (
    "key_hash" CHAR(64) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "window_ends_at" TIMESTAMPTZ(6) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("key_hash")
);

-- CreateIndex
CREATE INDEX "rate_limit_counters_window_ends_at_idx" ON "rate_limit_counters"("window_ends_at");
