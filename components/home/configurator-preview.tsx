"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function ConfiguratorPreview() {
  return (
    <section className="section-space bg-navy">
      <div className="section-shell">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="eyebrow">Configurator</p>
          <h2 className="display-font mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
            Trimite-ne un brief{" "}
            <span className="text-gold">in 2 minute.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-white/55">
            Nu ai nevoie de toate raspunsurile. Configuratorul nostru te ghideaza
            pas cu pas sa ne trimiti exact cat stii despre proiectul tau.
          </p>

          {/* Stylized form preview */}
          <div className="mx-auto mt-12 max-w-md">
            <div
              className="navy-glass-card p-8"
              style={{ transform: "perspective(800px) rotateX(3deg)" }}
            >
              <div className="space-y-4">
                {[
                  "Camerele pe care vrei sa le mobilezi...",
                  "Directie de culori si stil...",
                  "Deadline si detalii...",
                ].map((placeholder) => (
                  <div
                    key={placeholder}
                    className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/5 px-5 py-4 transition-colors hover:bg-white/8"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gold shadow-[0_0_8px_rgba(243,198,35,0.4)]" />
                    <span className="text-sm text-white/35">{placeholder}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/configurator"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4.5 text-sm font-bold uppercase tracking-[0.2em] text-navy transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(243,198,35,0.35)]"
          >
            Deschide configuratorul
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
