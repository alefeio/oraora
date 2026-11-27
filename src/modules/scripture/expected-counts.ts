import { SCRIPTURE_PASSAGES, SCRIPTURE_TOPICS } from "./catalog"

/** Contagens canônicas do catálogo oficial (referências only). */
export function getOfficialScriptureExpectedCounts() {
  const passageTopicLinks = SCRIPTURE_PASSAGES.reduce(
    (sum, passage) => sum + passage.topics.length,
    0,
  )
  return {
    passages: SCRIPTURE_PASSAGES.length,
    topics: SCRIPTURE_TOPICS.length,
    categoryTopicLinks: SCRIPTURE_TOPICS.length,
    passageTopicLinks,
  }
}

export const OFFICIAL_SCRIPTURE_EXPECTED = getOfficialScriptureExpectedCounts()
