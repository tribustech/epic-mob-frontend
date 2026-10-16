// Single source of truth for business facts. Feeds JSON-LD (components/seo),
// the /llms.txt route, and metadata. Confirmed with the owner on 2026-07-04.
// Anything not yet known is left empty and OMITTED from schema output — we never
// emit invented data (a wrong `sameAs` or fake address hurts trust and ranking).

import { contactDetails } from "@/lib/site-data";

export const SITE_URL = "https://epicmob.ro";

// Company registration details, shown on the privacy policy (data controller).
// The registered office is a legal address only — not published in schema,
// since the business serves clients nationally without a storefront.
export const legalEntity = {
  name: "EPIC MOB PRODUCTION S.R.L.",
  registeredOffice:
    "București, Sectorul 3, Calea Vitan nr. 199, bl. 52, sc. 2, et. 10, ap. 58",
  cui: "54806005",
  tradeRegister: "J2026035979007",
  euid: "ROONRC.J2026035979007",
};

export const business = {
  name: "Epic Mob",
  displayName: "Epic Mob Atelier",
  // Legal entity name — omitted from schema while empty.
  legalName: "EPIC MOB PRODUCTION S.R.L.",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  foundingDate: "2019",
  description:
    "Atelier de mobilier premium la comandă: bucătării, dressinguri, living și băi. Consultanță, proiectare 3D și execuție cap-coadă cu feronerie Blum și montaj inclus.",
  // National service-area business — no public street address.
  areaServedCountry: "România",
  telephone: contactDetails.phone,
  email: contactDetails.email,
  whatsapp: contactDetails.whatsapp,
  priceRange: "€€€",
  knowsLanguage: ["ro"],
  // Social / external profiles for `sameAs` — ties the brand to its identity
  // across platforms (helps search + LLM knowledge-graph linking).
  sameAs: [
    "https://www.instagram.com/epic.mob/",
    "https://www.tiktok.com/@epic_mob",
    "https://www.facebook.com/profile.php?id=61591804106486",
  ] as string[],
  // Core services offered — powers hasOfferCatalog and llms.txt.
  services: [
    "Bucătării la comandă",
    "Dressinguri și dulapuri",
    "Mobilier de living",
    "Mobilier de baie",
    "Mobilier rezidențial la comandă",
  ],
} as const;

/** Drop keys whose value is empty/undefined so JSON-LD never carries blanks. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v == null) return false;
      if (typeof v === "string") return v.length > 0;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    }),
  ) as Partial<T>;
}

/**
 * Primary entity: a national furniture atelier. FurnitureStore is a LocalBusiness
 * subtype search engines and LLMs map cleanly to "custom furniture business".
 */
export function buildBusinessSchema() {
  return compact({
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${SITE_URL}/#business`,
    name: business.name,
    legalName: business.legalName || undefined,
    alternateName: business.displayName,
    url: business.url,
    logo: business.logo,
    image: business.logo,
    description: business.description,
    foundingDate: business.foundingDate,
    telephone: business.telephone,
    email: business.email,
    priceRange: business.priceRange,
    knowsLanguage: [...business.knowsLanguage],
    currenciesAccepted: "RON",
    areaServed: { "@type": "Country", name: business.areaServedCountry },
    sameAs: business.sameAs.length ? [...business.sameAs] : undefined,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: business.telephone,
      email: business.email,
      contactType: "sales",
      areaServed: "RO",
      availableLanguage: ["Romanian"],
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicii Epic Mob",
      itemListElement: business.services.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service },
      })),
    },
  });
}

/** WebSite entity — ties the domain to the brand for knowledge-graph linking. */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: business.name,
    inLanguage: "ro",
    publisher: { "@id": `${SITE_URL}/#business` },
  };
}
