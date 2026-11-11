import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/brand"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: "2026-11-11",
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
