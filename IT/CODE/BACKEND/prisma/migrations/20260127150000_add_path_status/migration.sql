-- Add status to Path for precomputed path scoring
ALTER TABLE "Path" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'OPTIMAL';
