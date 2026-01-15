-- DropForeignKey
ALTER TABLE "PathSegment" DROP CONSTRAINT "PathSegment_pathId_fkey";

-- AddForeignKey
ALTER TABLE "PathSegment" ADD CONSTRAINT "PathSegment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path"("pathId") ON DELETE CASCADE ON UPDATE CASCADE;
