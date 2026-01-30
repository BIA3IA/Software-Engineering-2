/*
  Warnings:

  - You are about to drop the column `statistics` on the `Trip` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PathSegment_pathId_segmentId_key";

-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "statistics",
ADD COLUMN     "distanceKm" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Stat" (
    "statId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avgSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kilometers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("statId")
);

-- CreateTable
CREATE TABLE "OverallStat" (
    "userId" TEXT NOT NULL,
    "avgSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgKilometers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTripCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OverallStat_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stat_tripId_key" ON "Stat"("tripId");

-- CreateIndex
CREATE INDEX "Stat_userId_idx" ON "Stat"("userId");

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("tripId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverallStat" ADD CONSTRAINT "OverallStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
