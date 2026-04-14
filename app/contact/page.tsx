import { SectionHeading } from "@/components/section-heading";
import { contactDetails } from "@/lib/site-data";

export default function ContactPage() {
  return (
    <main className="section-shell section-space pt-32">
      <SectionHeading
        eyebrow="Contact"
        title="Pornim cu o discutie clara, apoi conturam solutia potrivita pentru casa ta."
        description="Daca ai deja schite, randari, masuratori sau inspiratie, ni le poti trimite direct. Daca nu, te ghidam noi."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-navy/8 bg-white p-8 shadow-card sm:p-10">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                Telefon
              </p>
              <a className="mt-3 block text-2xl text-navy" href={`tel:${contactDetails.phone}`}>
                {contactDetails.phone}
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold">
                Email
              </p>
              <a
                className="mt-3 block text-2xl text-navy"
                href={`mailto:${contactDetails.email}`}
              >
                {contactDetails.email}
              </a>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              className="rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-navy transition hover:-translate-y-0.5"
              href={contactDetails.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              Contact rapid pe WhatsApp
            </a>
            <a
              className="rounded-full border border-navy/20 px-6 py-3 text-sm uppercase tracking-[0.18em] text-navy transition hover:bg-navy hover:text-white"
              href="/configurator"
            >
              Deschide configuratorul
            </a>
          </div>
        </section>
        <section className="rounded-2xl border border-navy/8 bg-white p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Ce ajuta sa stim
          </p>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-navy/60">
            <li>Ai deja randari, schite sau masuratori?</li>
            <li>Ai linkuri Pinterest sau referinte vizuale?</li>
            <li>Ai ales electrocasnicele sau trebuie integrate in proiect?</li>
            <li>Ce camere vrei sa mobilezi si in ce termen?</li>
            <li>Ai preferinte de materiale, culori sau iluminare?</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
