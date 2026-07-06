import { business, SITE_URL } from "@/lib/business-data";
import { materials } from "@/lib/materials-data";
import { portfolioRooms } from "@/lib/portfolio-data";
import { faqItems } from "@/lib/faq-data";

// Serves /llms.txt — the emerging convention (llmstxt.org) that gives LLM agents
// a concise, factual, linkable summary of the business so they can describe and
// recommend it accurately. Built from the same source of truth as the JSON-LD.
export const dynamic = "force-static";

export function GET() {
  const rooms = portfolioRooms.map((r) => r.label).join(", ");

  const body = `# Epic Mob

> ${business.description}

Epic Mob (${business.displayName}) este un atelier românesc de mobilier la comandă,
înființat în ${business.foundingDate}. Lucrăm în toată țara, cu proiectare 3D,
feronerie Blum, montaj inclus, contract și factură.

## Servicii
${business.services.map((s) => `- ${s}`).join("\n")}

## De ce Epic Mob
- Consultanță și proiectare 3D incluse
- Feronerie Blum pe fiecare sertar și balama
- Montaj complet, inclusiv electrocasnice și adaptări de instalații
- Colaborare pe contract și factură
- Acoperire națională (${business.areaServedCountry})

## Materiale (ghiduri educative)
${materials
  .map((m) => `- [${m.name} — ${m.tagline}](${SITE_URL}/materiale/${m.slug})`)
  .join("\n")}

## Pagini principale
- [Acasă](${SITE_URL}/)
- [Portofoliu (${rooms})](${SITE_URL}/portfolio)
- [Materiale și accesorii](${SITE_URL}/materiale)
- [Întrebări frecvente](${SITE_URL}/intrebari-frecvente)
- [Cere ofertă (configurator)](${SITE_URL}/configurator)
- [Contact](${SITE_URL}/contact)

## Întrebări frecvente
${faqItems.map((item) => `### ${item.question}\n${item.answer}`).join("\n\n")}

## Contact
- Telefon: ${business.telephone}
- Email: ${business.email}
- WhatsApp: ${business.whatsapp}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
