import Link from "next/link";
import { LayoutGrid, SwatchBook } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { contactDetails } from "@/lib/site-data";

// Mobile-only sticky action bar (homepage). App-like: persistent primary CTA
// flanked by portfolio nav and quick WhatsApp contact.
export function WarmTabbar() {
  return (
    <nav className="warm-tabbar lg:hidden" aria-label="Acțiuni rapide">
      <Link href="/portfolio" className="warm-tabbar__side">
        <LayoutGrid size={20} strokeWidth={1.7} />
        <span>Portofoliu</span>
      </Link>

      <Link href="/materiale" className="warm-tabbar__side">
        <SwatchBook size={20} strokeWidth={1.7} />
        <span>Materiale</span>
      </Link>

      <Link href="/contact" className="warm-tabbar__cta">
        Cere o ofertă
      </Link>

      <a
        href={contactDetails.whatsapp}
        target="_blank"
        rel="noreferrer"
        className="warm-tabbar__icon"
        aria-label="Scrie-ne pe WhatsApp"
      >
        <WhatsAppIcon size={20} />
      </a>
    </nav>
  );
}
