-- DropForeignKey
ALTER TABLE "Path" DROP CONSTRAINT "Path_userId_fkey";

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "title" TEXT;

-- AddForeignKey
ALTER TABLE "Path" ADD CONSTRAINT "Path_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
