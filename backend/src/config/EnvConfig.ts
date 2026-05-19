import { z } from "zod";

const envSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(10),
  CLERK_PUBLISHABLE_KEY: z.string().min(10),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  USDA_API_KEY: z.string().min(1).default("DEMO_KEY"),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnv(env: unknown): ValidatedEnv {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(errors)}`
    );
  }
  return result.data;
}
