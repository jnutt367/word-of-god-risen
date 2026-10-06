import type { MetadataRoute } from "next";
import { getAllBooks, getChapters } from "@/lib/bible";
import { getAllPlans } from "@/lib/plans";

const BASE = "https://word-of-god-risen.vercel.app";

/** Full sitemap: every book, every chapter, plans, and key pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${BASE}/plans`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/shorts`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE}/search`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  for (const plan of getAllPlans()) {
    urls.push({
      url: `${BASE}/plans/${plan.id}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const book of getAllBooks()) {
    urls.push({
      url: `${BASE}/book/${book.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    const chapters = await getChapters(book.slug);
    chapters.forEach((_, i) => {
      urls.push({
        url: `${BASE}/book/${book.slug}/${i}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });
  }

  return urls;
}
