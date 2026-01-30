-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StatsPeriod') THEN
        CREATE TYPE "StatsPeriod" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR', 'OVERALL');
    END IF;
END $$;

-- Rename Stat table to Stats if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Stat') AND
       NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Stats') THEN
        ALTER TABLE "Stat" RENAME TO "Stats";
    END IF;
END $$;

-- Rename statId column to statsId if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Stats' AND column_name = 'statId'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Stats' AND column_name = 'statsId'
    ) THEN
        ALTER TABLE "Stats" RENAME COLUMN "statId" TO "statsId";
    END IF;
END $$;

-- Create table for period stats
CREATE TABLE IF NOT EXISTS "OverallStatsPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "StatsPeriod" NOT NULL,
    "avgSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgKilometers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalKilometers" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longestKilometer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "longestTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pathsCreated" INTEGER NOT NULL DEFAULT 0,
    "tripCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OverallStatsPeriod_pkey" PRIMARY KEY ("id")
);

-- Unique per user+period
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'OverallStatsPeriod_userId_period_key'
    ) THEN
        ALTER TABLE "OverallStatsPeriod"
        ADD CONSTRAINT "OverallStatsPeriod_userId_period_key" UNIQUE ("userId", "period");
    END IF;
END $$;

-- Index for lookups
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'OverallStatsPeriod_userId_period_idx'
    ) THEN
        CREATE INDEX "OverallStatsPeriod_userId_period_idx" ON "OverallStatsPeriod"("userId", "period");
    END IF;
END $$;

-- Foreign key to User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'OverallStatsPeriod_userId_fkey'
    ) THEN
        ALTER TABLE "OverallStatsPeriod"
        ADD CONSTRAINT "OverallStatsPeriod_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Migrate existing OverallStat data into OVERALL period (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'OverallStat') THEN
        INSERT INTO "OverallStatsPeriod" (
            "id",
            "userId",
            "period",
            "avgSpeed",
            "avgDuration",
            "avgKilometers",
            "totalKilometers",
            "totalTime",
            "longestKilometer",
            "longestTime",
            "pathsCreated",
            "tripCount",
            "updatedAt"
        )
        SELECT
            md5(random()::text || clock_timestamp()::text),
            "userId",
            'OVERALL',
            "avgSpeed",
            "avgDuration",
            "avgKilometers",
            "totalKilometers",
            "totalTime",
            "longestKilometer",
            "longestTime",
            "pathsCreated",
            "lastTripCount",
            "updatedAt"
        FROM "OverallStat"
        ON CONFLICT ("userId", "period") DO NOTHING;
    END IF;
END $$;

-- Drop old table if present
DROP TABLE IF EXISTS "OverallStat";
