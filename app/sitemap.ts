import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/business-data";
import { allPortfolioProjects } from "@/lib/portfolio-data";
import { materialSlugs } from "@/lib/materials-data";
import { MIN_LANDING_PRODUCTS, categoryLandings, onLanding, roomLandings } from "@/lib/shop/landing";
import { productBySlug } from "@/lib/shop/products";
import { availableProductSlugs } from "@/lib/shop/server";

// the shop part follows the CRM catalog (a kitchen page opens only once the CRM prices kitchens)
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/materiale`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/magazin`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/configurator`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/cere-oferta`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/intrebari-frecvente`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/termeni-si-conditii`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/politica-confidentialitate`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
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

  // only the product pages that open (the product page shows 404 for the others); none while the CRM is
  // unreachable, since the pages cannot be built then either
  const available = (await availableProductSlugs()) ?? [];
  const shopRoutes: MetadataRoute.Sitemap = available.map((slug) => ({
    url: `${SITE_URL}/magazin/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // room and kind-of-furniture pages, only those that open now (the page is a 404 with fewer products)
  const products = available.map((slug) => productBySlug(slug)).filter((p) => !!p);
  const landingRoutes: MetadataRoute.Sitemap = [...categoryLandings(), ...roomLandings()]
    .filter((l) => products.filter((p) => onLanding(l, p)).length >= MIN_LANDING_PRODUCTS)
    .map((l) => ({
      url: `${SITE_URL}${l.path}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...landingRoutes, ...shopRoutes, ...portfolioRoutes, ...materialRoutes];
}
