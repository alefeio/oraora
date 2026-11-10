import { prismaAdapter } from "@better-auth/prisma-adapter"
import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { prisma } from "@/lib/db/prisma"
import {
  passwordResetEmail,
  publicSignupEnabled,
  sendAuthEmail,
  verificationEmail,
} from "@/lib/auth/email"
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  RESET_TOKEN_EXPIRES_IN_SECONDS,
  SESSION_COOKIE_ATTRIBUTES,
  SESSION_EXPIRES_IN_SECONDS,
  USER_ROLES,
  requireEmailVerificationEnabled,
  roleForNewUser,
  secureSessionCookies,
} from "@/lib/auth/policy"

export function getAuthBaseURL(env: Record<string, string | undefined> = process.env): string {
  const configured = env.BETTER_AUTH_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")
  if (env.VERCEL_ENV === "production" && env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return "http://localhost:3000"
}

function getAuthSecret(env: Record<string, string | undefined> = process.env): string {
  const secret = env.BETTER_AUTH_SECRET?.trim()
  if (secret) return secret
  if (env.NEXT_PHASE === "phase-production-build") {
    return "build-only-placeholder-not-for-runtime-use"
  }
  throw new Error("BETTER_AUTH_SECRET is not set")
}

function trustedOrigins(env: Record<string, string | undefined> = process.env): string[] {
  const origins = new Set<string>([getAuthBaseURL(env)])
  if (env.NEXT_PUBLIC_APP_URL) origins.add(env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""))
  if (env.VERCEL_URL) origins.add(`https://${env.VERCEL_URL}`)
  return [...origins]
}

/**
 * Propaga falhas de entrega. Better Auth trata o erro; a UI não deve afirmar que o e-mail foi enviado.
 * Logs nunca incluem URL/token.
 */
async function deliverAuthEmail(to: string, message: { subject: string; html: string; text: string }) {
  try {
    await sendAuthEmail({ to, ...message })
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error"
    console.error("auth email failed", { name })
    throw error
  }
}

const signupOpen = publicSignupEnabled()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: getAuthSecret(),
  baseURL: getAuthBaseURL(),
  trustedOrigins: trustedOrigins(),
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS,
  },
  advanced: {
    useSecureCookies: secureSessionCookies(getAuthBaseURL()),
    defaultCookieAttributes: SESSION_COOKIE_ATTRIBUTES,
  },
  emailAndPassword: {
    enabled: true,
    // Preview/hospedado sem Resend: cadastro público permanece fechado.
    disableSignUp: !signupOpen,
    requireEmailVerification: requireEmailVerificationEnabled(),
    resetPasswordTokenExpiresIn: RESET_TOKEN_EXPIRES_IN_SECONDS,
    revokeSessionsOnPasswordReset: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    sendResetPassword: async ({ user, url }) => {
      await deliverAuthEmail(user.email, passwordResetEmail(url))
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await deliverAuthEmail(user.email, verificationEmail(url))
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: USER_ROLES.user,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return { data: { ...user, role: roleForNewUser(user.role) } }
        },
      },
    },
  },
  plugins: [nextCookies()],
  logger: {
    level: "error",
  },
})
