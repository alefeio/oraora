import { afterEach, describe, expect, it, vi } from "vitest"
import {
  AuthEmailConfigurationError,
  AuthEmailDeliveryError,
  assertHostedAuthEmailReady,
  createAuthEmailTransport,
  createMockAuthEmailTransport,
  publicSignupEnabled,
  resolveAuthEmailMode,
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

  it("libera cadastro hospedado só com Resend completo", () => {
    expect(
      publicSignupEnabled({
        VERCEL_ENV: "preview",
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        AUTH_EMAIL_FROM: "Ora Ora <noreply@example.com>",
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
  })

  it("propaga falha do Resend sem fingir sucesso", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 401 }))
    const transport = createAuthEmailTransport(
      {
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        AUTH_EMAIL_FROM: "Ora Ora <noreply@example.com>",
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

  it("envia via Resend quando a API responde ok", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "msg_1" }), { status: 200 }))
    const transport = createAuthEmailTransport(
      {
        VERCEL: "1",
        AUTH_EMAIL_MODE: "resend",
        RESEND_API_KEY: "re_test",
        AUTH_EMAIL_FROM: "Ora Ora <noreply@example.com>",
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
      }),
    )
  })
})
