"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { materials } from "@/lib/site-data";
import { SectionHeading } from "@/components/section-heading";

const comparisonHeaders = ["Material", "Durabilitate", "Umiditate", "Finisaj", "Pret"];

export function MaterialsSection() {
  return (
    <section className="section-space bg-bg">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Materiale"
          title="Fiecare camera cere materialul potrivit."
          description="Va ghidam spre alegerea corecta in functie de camera, buget si estetica dorita."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {materials.map((mat) => (
            <motion.article
              key={mat.name}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="group overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-400 hover:-translate-y-2 hover:shadow-card-hover"
            >
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={mat.image}
                  alt={mat.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-navy backdrop-blur-sm">
                    {mat.name}
                  </span>
                </div>
              </div>
              <div className="p-7">
                <ul className="space-y-3">
                  {mat.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-navy/65">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12 overflow-x-auto rounded-2xl bg-white shadow-card"
        >
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-navy/8">
                {comparisonHeaders.map((h) => (
                  <th key={h} className="px-7 py-5 text-left text-xs font-bold uppercase tracking-[0.22em] text-navy/40">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((mat) => (
                <tr key={mat.name} className="border-b border-navy/5 last:border-0 transition-colors hover:bg-navy/[0.02]">
                  <td className="px-7 py-5 font-bold text-navy">{mat.name}</td>
                  <td className="px-7 py-5 text-navy/60">{mat.durability}</td>
                  <td className="px-7 py-5 text-navy/60">{mat.moisture}</td>
                  <td className="px-7 py-5 text-navy/60">{mat.finish}</td>
                  <td className="px-7 py-5">
                    <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy">{mat.price}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
