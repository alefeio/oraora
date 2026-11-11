import { afterEach, describe, expect, it, vi } from "vitest"
import {
  AuthEmailConfigurationError,
  AuthEmailDeliveryError,
  assertHostedAuthEmailReady,
  assertResendFromAllowed,
  createAuthEmailTransport,
  createMockAuthEmailTransport,
  publicSignupEnabled,
  resolveAuthEmailMode,
  resolveResendFrom,
  sendAuthEmail,
  setAuthEmailTransportForTests,
  verificationEmail,
} from "@/lib/auth/email"

afterEach(() => {
  setAuthEmailTransportForTests(null)
})

describe("auth email transport", () => {
  it("usa console por padrão fora da Vercel", () => {
    expect(resolveAuthEmailMode({ NODE_ENV: "development" })).toBe("console")
  })

  it("resolve RESEND_FROM com precedência sobre AUTH_EMAIL_FROM", () => {
    expect(
      resolveResendFrom({
        RESEND_FROM: "Ora Ora <contato@oraora.ia.br>",
        AUTH_EMAIL_FROM: "Ora Ora <legado@example.com>",
      }),
    ).toBe("Ora Ora <contato@oraora.ia.br>")
    expect(resolveResendFrom({ AUTH_EMAIL_FROM: "Ora Ora <legado@example.com>" })).toBe(
      "Ora Ora <legado@example.com>",
    )
    expect(resolveResendFrom({})).toBeNull()
  })

  it("rejeita remetente Gmail", () => {
    expect(() => assertResendFromAllowed("oraoraads@gmail.com")).toThrow(
      AuthEmailConfigurationError,
    )
    expect(() =>
      assertResendFromAllowed("Ora Ora <contato@oraora.ia.br>"),
    ).not.toThrow()
  })

  it("exige resend na Vercel e bloqueia console", () => {
    expect(resolveAuthEmailMode({ VERCEL: "1" })).toBe("resend")
    expect(() =>
      assertHostedAuthEmailReady({
        VERCEL: "1",
        AUTH_EMAIL_MODE: "console",
      }),
    ).toThrow(AuthEmailConfigurationError)
    expect(
      publicSignupEnabled({
        VERCEL: "1",
        AUTH_EMAIL_MODE: "console",
      }),
    ).toBe(false)
  })

  it("bloqueia cadastro hospedado sem chave ou sem remetente", () => {
    expect(
      publicSignupEnabled({
        VERCEL_ENV: "preview",
        AUTH_EMAIL_MODE: "resend",
        RESEND_FROM: "Ora Ora <contato@oraora.ia.br>",
      }),
    ).toBe(false)
    expect(
      publicSignupEnabled({
        VERCEL_ENV: "preview",
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
      }),
    ).toBe(false)
  })

  it("bloqueia cadastro hospedado com Gmail mesmo com chave", () => {
    expect(
      publicSignupEnabled({
        VERCEL_ENV: "preview",
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        RESEND_FROM: "oraoraads@gmail.com",
      }),
    ).toBe(false)
  })

  it("libera cadastro hospedado com Resend completo via RESEND_FROM", () => {
    expect(
      publicSignupEnabled({
        VERCEL_ENV: "preview",
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        RESEND_FROM: "Ora Ora <contato@oraora.ia.br>",
      }),
    ).toBe(true)
  })

  it("aceita fallback legado AUTH_EMAIL_FROM no cadastro hospedado", () => {
    expect(
      publicSignupEnabled({
        VERCEL_ENV: "preview",
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        AUTH_EMAIL_FROM: "Ora Ora <contato@oraora.ia.br>",
      }),
    ).toBe(true)
  })

  it("aceita transporte mock injetável", async () => {
    const mock = createMockAuthEmailTransport()
    setAuthEmailTransportForTests(mock)
    const message = verificationEmail("https://example.test/verify?token=abc")
    await sendAuthEmail({ to: "pessoa@example.test", ...message })
    expect(mock.messages).toHaveLength(1)
    expect(mock.messages[0]?.to).toBe("pessoa@example.test")
    expect(mock.messages[0]?.subject).toMatch(/Confirme seu e-mail/)
    expect(JSON.stringify(mock.messages[0])).toContain("https://example.test/verify?token=abc")
  })

  it("não registra URL/token no log de console do processo", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const transport = createAuthEmailTransport({
      AUTH_EMAIL_MODE: "console",
      AUTH_EMAIL_LOG_PATH: "tmp/auth-emails-test.log",
    })
    await transport.send({
      to: "pessoa@example.test",
      ...verificationEmail("https://example.test/verify?token=secret-token"),
    })
    const logged = info.mock.calls.map((c) => JSON.stringify(c)).join("\n")
    expect(logged).not.toContain("secret-token")
    expect(logged).not.toContain("https://example.test/verify")
    info.mockRestore()
  })

  it("propaga falha do Resend sem fingir sucesso", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 401 }))
    const transport = createAuthEmailTransport(
      {
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        RESEND_FROM: "Ora Ora <contato@oraora.ia.br>",
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    await expect(
      transport.send({
        to: "pessoa@example.test",
        ...verificationEmail("https://example.test/verify"),
      }),
    ).rejects.toBeInstanceOf(AuthEmailDeliveryError)
  })

  it("envia via Resend quando a API responde ok usando RESEND_FROM", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "msg_1" }), { status: 200 }))
    const transport = createAuthEmailTransport(
      {
        VERCEL: "1",
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        RESEND_FROM: "Ora Ora <contato@oraora.ia.br>",
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    await transport.send({
      to: "pessoa@example.test",
      ...verificationEmail("https://example.test/verify"),
    })
    expect(fetchImpl).toHaveBeenCalledOnce()
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test",
        }),
        body: expect.stringContaining("contato@oraora.ia.br"),
      }),
    )
  })
})
