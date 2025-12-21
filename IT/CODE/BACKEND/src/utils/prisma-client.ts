// Prisma Client to interact with the database using accelerate URL from environment variables. 
// Accelerate is used to enable optimized database access.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

export default prisma;