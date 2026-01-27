-- Drop persisted path status/score (computed on read)
ALTER TABLE "Path" DROP COLUMN "status";
ALTER TABLE "Path" DROP COLUMN "score";
