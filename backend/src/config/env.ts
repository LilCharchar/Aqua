import * as dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta variable de entorno ${name}`);
  }
  return value;
}

export const ENV = {
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_SERVICE_KEY: requireEnv("SUPABASE_SERVICE_KEY"),
  PORT: process.env.PORT ?? "5000",
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
};
