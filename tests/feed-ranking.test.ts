import { describe, expect, it } from "vitest"
import {
  parseFeedPolicyDocument,
  rankPrayerRequestsForFeed,
} from "@/modules/prayer-requests/feed-ranking"
import type { FeedPolicyDocument } from "@/modules/prayer-requests/types"

const hypothesisPolicy: FeedPolicyDocument = {
  hypotheses: true,
  prayerCountBands: [
    { min: 0, max: 0, priorityRank: 0 },
    { min: 1, max: 2, priorityRank: 1 },
    { min: 3, max: 5, priorityRank: 2 },
    { min: 6, max: null, priorityRank: 3 },
  ],
  ageBandsHours: [
    { maxAgeHours: 72, priorityRank: 0 },
    { maxAgeHours: 168, priorityRank: 1 },
    { maxAgeHours: null, priorityRank: 2, leavePrimaryQueue: true },
  ],
}

describe("feed ranking", () => {
  const now = new Date("2026-11-09T12:00:00.000Z")

  it("prioriza quem tem menos orações", () => {
    const ranked = rankPrayerRequestsForFeed(
      [
        {
          id: "many",
          validPrayerCount: 8,
          rankedAt: new Date("2026-11-09T10:00:00.000Z"),
        },
        {
          id: "zero",
          validPrayerCount: 0,
          rankedAt: new Date("2026-11-08T10:00:00.000Z"),
        },
        {
          id: "few",
          validPrayerCount: 2,
          rankedAt: new Date("2026-11-09T08:00:00.000Z"),
        },
      ],
      hypothesisPolicy,
      now,
    )

    expect(ranked.map((item) => item.id)).toEqual(["zero", "few", "many"])
  })

  it("remove da fila principal pedidos além da janela temporal da política", () => {
    const ranked = rankPrayerRequestsForFeed(
      [
        {
          id: "fresh",
          validPrayerCount: 0,
          rankedAt: new Date("2026-11-08T12:00:00.000Z"),
        },
        {
          id: "old",
          validPrayerCount: 0,
          rankedAt: new Date("2026-10-30T12:00:00.000Z"),
        },
      ],
      hypothesisPolicy,
      now,
    )

    expect(ranked.map((item) => item.id)).toEqual(["fresh"])
  })

  it("com política incompleta permanece determinístico e sem popularidade", () => {
    const incomplete = parseFeedPolicyDocument({
      prayerCountBands: [{ min: 0, max: null, priorityRank: null }],
      ageBandsHours: [{ maxAgeHours: null, priorityRank: null }],
    })

    const ranked = rankPrayerRequestsForFeed(
      [
        {
          id: "b",
          validPrayerCount: 3,
          rankedAt: new Date("2026-11-09T11:00:00.000Z"),
        },
        {
          id: "a",
          validPrayerCount: 0,
          rankedAt: new Date("2026-11-09T09:00:00.000Z"),
        },
      ],
      incomplete,
      now,
    )

    expect(ranked[0]?.id).toBe("a")
    expect(ranked[1]?.id).toBe("b")
  })
})
