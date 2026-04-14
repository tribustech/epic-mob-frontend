"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { heroImages, trustSignals } from "@/lib/site-data";

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-navy"
      style={{ height: "100dvh", minHeight: "700px", marginTop: "-80px" }}
    >
      {/* Background images with Ken Burns */}
      {heroImages.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt=""
            fill
            className={`object-cover ${
              index === currentIndex ? "animate-ken-burns" : ""
            }`}
            priority={index < 2}
            sizes="100vw"
            quality={85}
          />
        </div>
      ))}

      {/* Multi-layer overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(16,55,92,0.95) 0%, rgba(16,55,92,0.75) 45%, rgba(16,55,92,0.4) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(16,55,92,0.6) 0%, transparent 40%)",
        }}
      />

      {/* Content */}
      <div className="section-shell relative z-10 flex h-full flex-col justify-center pb-40 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-10 bg-gold" />
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.4em] text-gold">
            Mobilier premium la comanda
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="display-font mt-8 max-w-[48rem] text-[3.2rem] leading-[1.05] text-white sm:text-[4.2rem] lg:text-[5.5rem]"
        >
          Executie care se simte{" "}
          <span className="text-gold">premium</span>{" "}
          din prima privire.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-8 max-w-xl text-lg leading-8 text-white/70 sm:text-xl"
        >
          Mobilier personalizat cu consultanta, design si montaj complet — de la prima discutie pana la ultimul detaliu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="mt-12 flex flex-wrap gap-5"
        >
          <Link
            href="/configurator"
            className="group relative overflow-hidden rounded-full bg-gold px-8 py-4.5 text-sm font-bold uppercase tracking-[0.2em] text-navy transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(243,198,35,0.35)]"
          >
            Incepe proiectul
          </Link>
          <Link
            href="/portfolio"
            className="rounded-full border-2 border-white/20 px-8 py-4.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all duration-300 hover:border-white/40 hover:bg-white/10"
          >
            Vezi portofoliul
          </Link>
        </motion.div>
      </div>

      {/* Trust bar */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.9 }}
        className="absolute bottom-0 left-1/2 z-10 w-full max-w-5xl -translate-x-1/2 translate-y-1/2 px-6"
      >
        <div className="flex items-center justify-center gap-8 rounded-2xl bg-white px-10 py-6 shadow-elevated sm:gap-12">
          {trustSignals.map((signal, i) => (
            <div key={signal} className="flex items-center gap-8 sm:gap-12">
              <span className="whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[0.22em] text-navy">
                {signal}
              </span>
              {i < trustSignals.length - 1 && (
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
