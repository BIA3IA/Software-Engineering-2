// Prisma Client to interact with the database using accelerate URL from environment variables. 
// Accelerate is used to enable optimized database access.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

export default prisma;
