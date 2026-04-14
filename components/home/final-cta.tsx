"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { contactDetails } from "@/lib/site-data";

export function FinalCta() {
  return (
    <section className="relative flex min-h-[540px] items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/portfolio/kitchen-ornate-navy-overview.jpg"
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: "center 40%" }}
          sizes="100vw"
        />
        {/* Multi-layer overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(16,55,92,0.92) 0%, rgba(16,55,92,0.78) 50%, rgba(16,55,92,0.85) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(16,55,92,0.5) 0%, transparent 50%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="section-shell relative z-10 py-24 text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-gold" />
          <p className="eyebrow">Gata de start?</p>
          <span className="h-px w-8 bg-gold" />
        </div>
        <h2 className="display-font mx-auto mt-5 max-w-2xl text-4xl leading-tight text-white sm:text-5xl lg:text-[4rem]">
          Hai sa construim{" "}
          <span className="text-gold">impreuna.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-8 text-white/50">
          Completeaza configuratorul sau suna-ne direct — raspundem in mai putin de 24 ore.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/configurator"
            className="group relative overflow-hidden rounded-full bg-gold px-8 py-4.5 text-sm font-bold uppercase tracking-[0.2em] text-navy transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(243,198,35,0.35)]"
          >
            Incepe proiectul
          </Link>
          <a
            href={`tel:${contactDetails.phone}`}
            className="flex items-center gap-3 rounded-full border-2 border-white/20 px-8 py-4.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:border-white/40 hover:bg-white/10"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            Suna acum
          </a>
        </div>
      </motion.div>
    </section>
  );
}
