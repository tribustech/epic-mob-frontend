"use client";

import { motion } from "framer-motion";
import { servicePillars } from "@/lib/site-data";
import { SectionHeading } from "@/components/section-heading";

export function ServicesShowcase() {
  return (
    <section className="section-space bg-navy">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Servicii"
          title="De la idee la montaj, un proces coerent."
          variant="dark"
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
          className="mt-16 space-y-5"
        >
          {servicePillars.map((item, index) => (
            <motion.article
              key={item.title}
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
              }}
              className="navy-glass-card gold-left-accent pl-8 pr-8 py-8 sm:py-10 sm:pl-10 sm:pr-10"
            >
              <div className="flex items-start gap-6">
                <span className="display-font text-5xl leading-none text-gold/80 sm:text-6xl">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-white sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-2xl text-[0.95rem] leading-8 text-white/55">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
