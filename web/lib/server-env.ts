let warned = false;

export function getApiBase(): string {
  const internal = process.env.API_BASE_INTERNAL;
  const publicBase = process.env.NEXT_PUBLIC_API_BASE;

  if (!internal && !publicBase && process.env.NODE_ENV === 'production' && !warned) {
    console.warn(
      '[server-env] Neither API_BASE_INTERNAL nor NEXT_PUBLIC_API_BASE is set in production. Falling back to http://localhost:8000.'
    );
    warned = true;
  }

  const base = internal || publicBase || 'http://localhost:8000';
  return base.replace(/\/$/, '');
}
