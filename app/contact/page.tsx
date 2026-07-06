import type { Metadata } from "next";
import { ContactView } from "@/components/contact/contact-view";

export const metadata: Metadata = {
  title: "Contact — EpicMob",
  description:
    "Scrie-ne despre proiectul tău sau sună-ne direct. Răspundem rapid, pe WhatsApp, telefon sau email.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Epic Mob",
    description:
      "Scrie-ne despre proiectul tău sau sună-ne direct. Răspundem rapid, pe WhatsApp, telefon sau email.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <main className="contact-warm">
      <ContactView />
    </main>
  );
}
