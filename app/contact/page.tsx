import type { Metadata } from "next";
import { ContactView } from "@/components/contact/contact-view";

export const metadata: Metadata = {
  title: "Contact — EpicMob",
  description:
    "Scrie-ne despre proiectul tau sau suna-ne direct. Raspundem rapid, pe WhatsApp, telefon sau email.",
};

export default function ContactPage() {
  return (
    <main className="contact-warm">
      <ContactView />
    </main>
  );
}
