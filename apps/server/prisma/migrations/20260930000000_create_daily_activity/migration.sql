-- CreateTable
CREATE TABLE "daily_activity" (
    "user_id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "first_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "minutes_active" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "facilities_opened" INTEGER NOT NULL DEFAULT 0,
    "market_summaries_opened" INTEGER NOT NULL DEFAULT 0,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "ai_summaries" INTEGER NOT NULL DEFAULT 0,
    "feedback_sent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_activity_pkey" PRIMARY KEY ("user_id","day")
);

-- CreateIndex
CREATE INDEX "daily_activity_day_idx" ON "daily_activity"("day");
