import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';
import { resolve } from 'path';

const envPath = '/Users/mikkelmogensen/Desktop/Project/LocationInquirer/.env';
console.log('About to load .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env file:', result.error);
}

console.log('Loaded env vars:', {
    hasDbUrl: !!process.env.DATABASE_URL,
    envVars: Object.keys(process.env)
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
