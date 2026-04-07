import { PrismaClient } from "../../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
// console.log(process.env.DIRECT_URL)
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL,
});

export const prisma = new PrismaClient({ adapter });