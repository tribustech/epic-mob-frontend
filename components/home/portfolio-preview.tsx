"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { portfolioProjects } from "@/lib/site-data";
import { SectionHeading } from "@/components/section-heading";

export function PortfolioPreview() {
  return (
    <section className="section-space bg-bg">
      <div className="section-shell">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Portofoliu"
            title="Proiecte reale, nu randari."
          />
          <Link
            href="/portfolio"
            className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-navy/15 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-navy transition-all duration-300 hover:border-navy hover:bg-navy hover:text-white"
          >
            Vezi tot portofoliul
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
          className="mt-16 columns-2 gap-5 space-y-5 lg:columns-3"
        >
          {portfolioProjects.map((project) => (
            <motion.article
              key={project.title}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className="group relative break-inside-avoid overflow-hidden rounded-2xl shadow-card"
            >
              <div className={`relative ${project.tall ? "h-[22rem] sm:h-[28rem]" : "h-52 sm:h-64"}`}>
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                {/* Always-visible subtle gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end bg-navy/0 p-6 transition-all duration-400 group-hover:bg-navy/40">
                  <div className="translate-y-3 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-gold">
                      {project.space}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-white">
                      {project.title}
                    </p>
                  </div>
                </div>
                {/* Always-visible bottom label */}
                <div className="absolute bottom-0 left-0 p-5 group-hover:opacity-0 transition-opacity duration-300">
                  <p className="text-xs font-semibold text-white/90 drop-shadow-lg">
                    {project.space}
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
