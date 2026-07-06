import { SITE_URL } from "@/lib/business-data";

/**
 * Server component that emits a JSON-LD <script>. Next streams this into the
 * document; `<` escaping guards against a "</script>" sequence inside data
 * breaking out of the tag.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

type Crumb = { name: string; path: string };

/** BreadcrumbList for a detail page. `path` is site-relative (starts with "/"). */
export function buildBreadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}
