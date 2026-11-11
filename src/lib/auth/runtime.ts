type EnvLike = Record<string, string | undefined>

/** Detecção de runtime hospedado — sem imports Node (seguro para Client Components). */
export function isHostedRuntime(env: EnvLike = process.env): boolean {
  return Boolean(env.VERCEL || env.VERCEL_ENV)
}
