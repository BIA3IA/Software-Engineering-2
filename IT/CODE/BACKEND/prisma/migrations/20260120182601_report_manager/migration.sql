-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('CONFIRMED', 'REJECTED', 'IGNORED', 'CREATED');

-- CreateTable
CREATE TABLE "Report" (
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obstacleType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "acquisitionMode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reportStatus" "ReportStatus" NOT NULL DEFAULT 'CREATED',
    "polylineCoordinates" JSONB NOT NULL,
    "pathSegmentId" TEXT,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("reportId")
);

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_segmentId_idx" ON "Report"("segmentId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("segmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_pathSegmentId_fkey" FOREIGN KEY ("pathSegmentId") REFERENCES "PathSegment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
