import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/business-data";
import { allPortfolioProjects } from "@/lib/portfolio-data";
import { materialSlugs } from "@/lib/materials-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/materiale`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/configurator`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/intrebari-frecvente`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];

  const portfolioRoutes: MetadataRoute.Sitemap = allPortfolioProjects.map(
    (project) => ({
      url: `${SITE_URL}/portfolio/${project.slug}`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.7,
    }),
  );

  const materialRoutes: MetadataRoute.Sitemap = materialSlugs.map((slug) => ({
    url: `${SITE_URL}/materiale/${slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...portfolioRoutes, ...materialRoutes];
}
