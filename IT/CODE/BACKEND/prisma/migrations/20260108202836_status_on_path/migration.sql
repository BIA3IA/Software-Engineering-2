-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemPreferences" TEXT[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "tokenId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("tokenId")
);

-- CreateTable
CREATE TABLE "Trip" (
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "origin" JSONB NOT NULL,
    "destination" JSONB NOT NULL,
    "statistics" JSONB NOT NULL,
    "weather" JSONB,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("tripId")
);

-- CreateTable
CREATE TABLE "Segment" (
    "segmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPTIMAL',
    "polylineCoordinates" JSONB NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "TripSegment" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "nextSegmentId" TEXT,

    CONSTRAINT "TripSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Path" (
    "pathId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPTIMAL',
    "origin" JSONB NOT NULL,
    "destination" JSONB NOT NULL,
    "visibility" BOOLEAN NOT NULL DEFAULT false,
    "creationMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "score" DOUBLE PRECISION,
    "title" TEXT,
    "description" TEXT,

    CONSTRAINT "Path_pkey" PRIMARY KEY ("pathId")
);

-- CreateTable
CREATE TABLE "PathSegment" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "nextSegmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPTIMAL',

    CONSTRAINT "PathSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TripSegment_tripId_segmentId_key" ON "TripSegment"("tripId", "segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PathSegment_pathId_segmentId_key" ON "PathSegment"("pathId", "segmentId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSegment" ADD CONSTRAINT "TripSegment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("tripId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSegment" ADD CONSTRAINT "TripSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("segmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Path" ADD CONSTRAINT "Path_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathSegment" ADD CONSTRAINT "PathSegment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path"("pathId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathSegment" ADD CONSTRAINT "PathSegment_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "Segment"("segmentId") ON DELETE RESTRICT ON UPDATE CASCADE;
