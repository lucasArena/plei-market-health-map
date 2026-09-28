-- CreateTable
CREATE TABLE "login_events" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "signed_in_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_events_session_id_key" ON "login_events"("session_id");

-- CreateIndex
CREATE INDEX "login_events_signed_in_at_idx" ON "login_events"("signed_in_at" DESC);

-- CreateIndex
CREATE INDEX "login_events_user_id_signed_in_at_idx" ON "login_events"("user_id", "signed_in_at" DESC);

