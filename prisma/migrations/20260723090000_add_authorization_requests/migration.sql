CREATE TABLE "AuthorizationRequest" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthorizationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthorizationRequest_state_key" ON "AuthorizationRequest"("state");
CREATE INDEX "AuthorizationRequest_expiresAt_idx" ON "AuthorizationRequest"("expiresAt");
CREATE UNIQUE INDEX "Channel_userId_channelId_key" ON "Channel"("userId", "channelId");

ALTER TABLE "AuthorizationRequest"
ADD CONSTRAINT "AuthorizationRequest_telegramId_fkey"
FOREIGN KEY ("telegramId") REFERENCES "User"("telegramId") ON DELETE CASCADE ON UPDATE CASCADE;
