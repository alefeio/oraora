export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = "DomainError"
  }
}

export class PrayerNotAllowedError extends DomainError {
  constructor(message: string, code = "PRAYER_NOT_ALLOWED") {
    super(message, code, 403)
  }
}

export class PrayerNotFoundError extends DomainError {
  constructor(message = "Oração não encontrada.") {
    super(message, "PRAYER_NOT_FOUND", 404)
  }
}

export class EligibilityRequiredError extends DomainError {
  constructor(
    message = "Antes de pedir uma oração, ore por alguém.",
    code = "ELIGIBILITY_REQUIRED",
  ) {
    super(message, code, 403)
  }
}
