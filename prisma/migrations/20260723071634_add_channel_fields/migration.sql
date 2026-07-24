/*
  Warnings:

  - A unique constraint covering the columns `[channelId]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "channelId" TEXT,
ADD COLUMN     "channelTitle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Channel_channelId_key" ON "Channel"("channelId");
