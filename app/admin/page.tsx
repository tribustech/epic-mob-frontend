import Link from "next/link";
import { headers } from "next/headers";
import { currentAdmin } from "@/lib/admin/session";
import { adminSecret } from "@/lib/admin/token";
import { CheckLinkBox } from "@/components/admin/check-link-box";

export const dynamic = "force-dynamic";

/** Where the CRM sends the admin back: this site's own /admin/callback (the CRM checks the origin). */
async function callbackUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "epicmob.ro";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/admin/callback`;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ eroare?: string }> }) {
  const { eroare } = await searchParams;
  const admin = await currentAdmin();
  const crm = process.env.CRM_API_URL?.replace(/\/+$/, "");

  if (!admin) {
    const ready = !!crm && !!adminSecret();
    return (
      <section className="adm-login">
        <h1>Admin EpicMob</h1>
        <p>Vezi din ce se face prețul fiecărui produs: materiale, feronerie, manoperă și reducere.</p>
        {eroare && <p className="adm-bad">Login-ul n-a mers (token greșit sau expirat). Încearcă din nou.</p>}
        {ready ? (
          <a className="adm-btn" href={`${crm}/atelier/site-login?return=${encodeURIComponent(await callbackUrl())}`}>
            Intră cu contul din CRM
          </a>
        ) : (
          <p className="adm-bad">Login-ul de admin nu e configurat (lipsește CRM_API_URL sau ATELIER_ADMIN_SECRET).</p>
        )}
      </section>
    );
  }

  const until = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Bucharest" }).format(new Date(admin.exp * 1000));
  return (
    <section className="adm-home">
      <div className="adm-home__head">
        <h1>Salut, {admin.name}</h1>
        <form action="/admin/logout" method="post">
          <button className="adm-btn adm-btn--ghost" type="submit">Ieși</button>
        </form>
      </div>
      <p>Ești logat ca admin până la {until}. Pe site vezi acum, pe fiecare produs, butonul „Admin · defalcare preț” și pe carduri costul și prețul.</p>
      <ul className="adm-links">
        <li><Link href="/admin/preturi">Toate combinațiile din magazin (tabel)</Link></li>
        <li><Link href="/magazin">Magazinul, cu prețurile defalcate pe carduri</Link></li>
        <li><Link href="/configurator">Configuratorul, cu defalcarea live</Link></li>
      </ul>
      <CheckLinkBox />
    </section>
  );
}
