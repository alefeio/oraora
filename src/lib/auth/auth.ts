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
import { getAuthBaseURL, resolveTrustedOrigins } from "@/lib/auth/trusted-origins"

export { getAuthBaseURL } from "@/lib/auth/trusted-origins"

function getAuthSecret(env: Record<string, string | undefined> = process.env): string {
  const secret = env.BETTER_AUTH_SECRET?.trim()
  if (secret) return secret
  if (env.NEXT_PHASE === "phase-production-build") {
    return "build-only-placeholder-not-for-runtime-use"
  }
  throw new Error("BETTER_AUTH_SECRET is not set")
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
  // Preview: inclui VERCEL_BRANCH_URL + wildcard do projeto (alias git ≠ VERCEL_URL).
  trustedOrigins: resolveTrustedOrigins(),
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
