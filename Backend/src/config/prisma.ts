import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const caCert = readFileSync("./certs/ca.pem", "utf8");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    ca: caCert,
    rejectUnauthorized: true,
  },
});

const prisma = new PrismaClient({ adapter });

export default prisma;