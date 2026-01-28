-- Add segmentId to Report and backfill from PathSegment
ALTER TABLE "Report" ADD COLUMN "segmentId" TEXT;

UPDATE "Report" r
SET "segmentId" = ps."segmentId"
FROM "PathSegment" ps
WHERE r."pathSegmentId" = ps."id";

ALTER TABLE "Report" ALTER COLUMN "segmentId" SET NOT NULL;

CREATE INDEX "Report_segmentId_idx" ON "Report"("segmentId");

-- Update foreign keys
ALTER TABLE "Report" DROP CONSTRAINT "Report_pathSegmentId_fkey";
ALTER TABLE "Report" DROP CONSTRAINT "Report_tripId_fkey";

ALTER TABLE "Report" ADD CONSTRAINT "Report_segmentId_fkey"
FOREIGN KEY ("segmentId") REFERENCES "Segment"("segmentId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report" ADD CONSTRAINT "Report_tripId_fkey"
FOREIGN KEY ("tripId") REFERENCES "Trip"("tripId")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old column
ALTER TABLE "Report" DROP COLUMN "pathSegmentId";
