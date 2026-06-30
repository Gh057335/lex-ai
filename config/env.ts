import { z } from 'zod';

/**
 * Centralised environment configuration.
 *
 * Every external credential is OPTIONAL. When a credential is absent the
 * application transparently falls back to a fully functional DEMO mode backed
 * by in-memory mock data and a mock AI provider — so the project deploys and
 * runs end-to-end with zero configuration (ideal for a portfolio).
 *
 * When the credentials ARE provided the exact same code paths switch to the
 * real Anthropic + Supabase services. Nothing else in the codebase needs to
 * know which mode is active.
 */

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/** Treat empty / whitespace-only env values as "unset". */
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;
  const result = EnvSchema.safeParse({
    ANTHROPIC_API_KEY: clean(process.env.ANTHROPIC_API_KEY),
    NEXT_PUBLIC_SUPABASE_URL: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SITE_URL: clean(process.env.NEXT_PUBLIC_SITE_URL),
  });
  if (!result.success) {
    // Only malformed values (e.g. a non-URL Supabase URL) land here — missing
    // values are valid (they select demo mode). Surface a clear message.
    const issues = result.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`).join(', ');
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  _env = result.data;
  return _env;
}

/** True when a real Anthropic key is configured (live AI). */
export function hasAnthropic(): boolean {
  return Boolean(getEnv().ANTHROPIC_API_KEY);
}

/** True when real Supabase credentials are configured (live database). */
export function hasSupabase(): boolean {
  const env = getEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Resolve the public site URL for metadata, falling back to Vercel/localhost. */
export function getSiteUrl(): string {
  return (
    getEnv().NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}
