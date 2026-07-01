const steps = [
  { title: "Discuție", description: "Vorbim despre ce îți dorești, stilul și ce ai deja decis." },
  { title: "Măsurători", description: "Venim la măsurători sau pornim de la cele pe care le ai deja." },
  { title: "Materiale", description: "Alegem împreună finisajele, culorile și feroneria Blum." },
  { title: "Ofertă", description: "Îți pregătim o ofertă detaliată, fără obligații." },
  { title: "Producție", description: "Executăm mobila în atelierul propriu, cu atenție la detalii." },
  { title: "Montaj", description: "Livrăm și montăm complet, inclusiv electrocasnicele." },
];

export function WarmProcess() {
  return (
    <section className="bg-cream">
      <div className="section-shell py-20 sm:py-24">
        <div className="max-w-xl">
          <p className="eyebrow-warm">Cum lucrăm</p>
          <h2 className="display-font mt-4 text-4xl leading-tight text-espresso sm:text-5xl">
            De la schiță la montaj
          </h2>
        </div>

        <ol className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              {(index + 1) % 3 !== 0 && index < steps.length - 1 && (
                <span className="absolute left-14 top-6 hidden h-px w-[calc(100%-3rem)] bg-[var(--line)] lg:block" />
              )}
              <span className="proc-step__num">0{index + 1}</span>
              <h3 className="mt-4 text-xl font-semibold text-espresso">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-base leading-7 text-espresso/60">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
