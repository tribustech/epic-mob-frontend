import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin/session";
import { priceCheckRows } from "@/lib/shop/price-check";
import { getShopCatalog } from "@/lib/shop/server";
import { PriceTable, type TableRow } from "@/components/admin/price-table";

export const dynamic = "force-dynamic";

/** Every shop combination with its price breakdown (the prices load in the browser, product by product). */
export default async function AdminPricesPage() {
  if (!(await currentAdmin())) redirect("/admin");
  const catalog = await getShopCatalog();
  if (!catalog) return <p className="adm-bad">Catalogul din CRM nu răspunde acum. Încearcă puțin mai târziu.</p>;
  const rows: TableRow[] = priceCheckRows(catalog).map((r) => ({
    key: r.key, slug: r.slug, name: r.name, category: r.category, categoryLabel: r.categoryLabel,
    paletteName: r.paletteName, variantLabel: r.variantLabel, config: r.config, offerPercent: r.offer?.percent ?? null, path: r.path,
  }));
  return (
    <>
      <h1>Prețurile magazinului, defalcate</h1>
      <p className="adm-muted">
        Fiecare produs în fiecare culoare, plus opțiunile pe care clientul le poate schimba (mânere, uși, oglindă) pe culoarea de bază.
        Cifrele vin din CRM. {rows.length} combinații.
      </p>
      <PriceTable rows={rows} />
    </>
  );
}
