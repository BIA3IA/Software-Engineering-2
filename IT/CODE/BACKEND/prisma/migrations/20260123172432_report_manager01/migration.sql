/*
  Warnings:

  - You are about to drop the column `acquisitionMode` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `polylineCoordinates` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `reportStatus` on the `Report` table. All the data in the column will be lost.
  - Added the required column `position` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportMode` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Made the column `pathSegmentId` on table `Report` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_pathSegmentId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- DropIndex
DROP INDEX "Report_segmentId_idx";

-- DropIndex
DROP INDEX "Report_userId_idx";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "acquisitionMode",
DROP COLUMN "path",
DROP COLUMN "polylineCoordinates",
DROP COLUMN "reportStatus",
ADD COLUMN     "position" JSONB NOT NULL,
ADD COLUMN     "reportMode" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'CREATED',
ALTER COLUMN "pathSegmentId" SET NOT NULL;

-- DropEnum
DROP TYPE "ReportStatus";

-- CreateTable
CREATE TABLE "Confirmation" (
    "confirmationId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decision" TEXT NOT NULL,

    CONSTRAINT "Confirmation_pkey" PRIMARY KEY ("confirmationId")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_pathSegmentId_fkey" FOREIGN KEY ("pathSegmentId") REFERENCES "PathSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("reportId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
