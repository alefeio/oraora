import type { MetadataRoute } from "next"

/** Ambiente interno: não indexar. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  }
}
