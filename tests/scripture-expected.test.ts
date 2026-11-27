import { describe, expect, it } from "vitest"
import { OFFICIAL_SCRIPTURE_EXPECTED } from "@/modules/scripture/expected-counts"

describe("official scripture catalog counts", () => {
  it("bate as contagens canônicas do gate UI-05D.1R", () => {
    expect(OFFICIAL_SCRIPTURE_EXPECTED).toEqual({
      passages: 10,
      topics: 10,
      categoryTopicLinks: 10,
      passageTopicLinks: 18,
    })
  })
})
