import type { Metadata } from "next";
import { ContactView } from "@/components/contact/contact-view";
import { baseOpenGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Scrie-ne despre proiectul tău sau sună-ne direct. Răspundem rapid, pe WhatsApp, telefon sau email.",
  alternates: { canonical: "/contact" },
  openGraph: {
    ...baseOpenGraph,
    title: "Contact | Epic Mob",
    description:
      "Scrie-ne despre proiectul tău sau sună-ne direct. Răspundem rapid, pe WhatsApp, telefon sau email.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="contact-warm">
      <ContactView />
    </main>
  );
}
