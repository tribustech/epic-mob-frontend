"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { processSteps } from "@/lib/site-data";
import { SectionHeading } from "@/components/section-heading";

const stepIcons: React.ReactNode[] = [
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>,
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>,
  <svg key="5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>,
  <svg key="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>,
];

export function ProcessSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  });

  return (
    <section ref={containerRef} className="relative section-space bg-bg">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Proces"
          title="6 pasi catre mobilierul perfect."
          centered
        />

        {/* Desktop: Serpentine Timeline */}
        <div className="relative mt-20 hidden lg:block">
          <svg
            className="absolute left-1/2 top-0 h-full -translate-x-1/2"
            width="200"
            viewBox="0 0 200 1200"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 100 0 C 100 60, 180 80, 180 100 C 180 120, 20 160, 20 200 C 20 240, 180 280, 180 300 C 180 320, 20 360, 20 400 C 20 440, 180 480, 180 500 C 180 520, 20 560, 20 600 C 20 640, 180 680, 180 700 C 180 720, 20 760, 20 800 C 20 840, 180 880, 180 900 C 180 920, 100 960, 100 1000"
              stroke="rgba(16,55,92,0.08)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <motion.path
              d="M 100 0 C 100 60, 180 80, 180 100 C 180 120, 20 160, 20 200 C 20 240, 180 280, 180 300 C 180 320, 20 360, 20 400 C 20 440, 180 480, 180 500 C 180 520, 20 560, 20 600 C 20 640, 180 680, 180 700 C 180 720, 20 760, 20 800 C 20 840, 180 880, 180 900 C 180 920, 100 960, 100 1000"
              stroke="url(#goldGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pathLength: scrollYProgress }}
            />
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F3C623" />
                <stop offset="100%" stopColor="#EB8317" />
              </linearGradient>
            </defs>
          </svg>

          <div className="relative space-y-20">
            {processSteps.map((step, index) => {
              const isRight = index % 2 === 0;
              const threshold = index / processSteps.length;

              return (
                <TimelineStep
                  key={step.title}
                  step={step}
                  index={index}
                  isRight={isRight}
                  icon={stepIcons[index]}
                  scrollProgress={scrollYProgress}
                  threshold={threshold}
                />
              );
            })}
          </div>
        </div>

        {/* Mobile: Vertical straight line */}
        <div className="relative mt-14 lg:hidden">
          <div className="absolute left-5 top-0 h-full w-0.5" style={{ backgroundColor: "rgba(16,55,92,0.08)" }}>
            <motion.div
              className="h-full w-full origin-top"
              style={{
                scaleY: scrollYProgress,
                background: "linear-gradient(180deg, #F3C623, #EB8317)",
              }}
            />
          </div>

          <div className="space-y-6 pl-14">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="absolute left-[11px] mt-1.5">
                  <span className="block h-4 w-4 rounded-full border-[3px] border-gold bg-bg shadow-[0_0_0_4px_rgba(243,198,35,0.12)]" />
                </div>
                <div className="card-premium p-6">
                  <div className="flex items-center gap-3">
                    <div className="glass-icon-sm">
                      {stepIcons[index]}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
                      Pasul 0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-navy">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-navy/55">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineStep({
  step,
  index,
  isRight,
  icon,
  scrollProgress,
  threshold,
}: {
  step: { title: string; description: string };
  index: number;
  isRight: boolean;
  icon: React.ReactNode;
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  threshold: number;
}) {
  const opacity = useTransform(
    scrollProgress,
    [Math.max(0, threshold - 0.05), threshold + 0.05],
    [0.3, 1]
  );
  const y = useTransform(
    scrollProgress,
    [Math.max(0, threshold - 0.05), threshold + 0.05],
    [20, 0]
  );

  return (
    <div className={`flex items-center gap-10 ${isRight ? "flex-row" : "flex-row-reverse"}`}>
      <motion.div
        style={{ opacity, y }}
        className={`w-[42%] ${isRight ? "text-right" : "text-left"}`}
      >
        <div className="card-premium inline-block p-8 text-left">
          <div className="flex items-center gap-4">
            <div className="glass-icon">
              {icon}
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold">
              Pasul 0{index + 1}
            </span>
          </div>
          <h3 className="mt-5 text-xl font-bold text-navy">
            {step.title}
          </h3>
          <p className="mt-3 text-[0.95rem] leading-8 text-navy/55">
            {step.description}
          </p>
        </div>
      </motion.div>

      <div className="relative z-10 flex shrink-0 items-center justify-center">
        <motion.div
          style={{ opacity }}
          className="h-5 w-5 rounded-full border-[3px] border-gold bg-bg shadow-[0_0_0_6px_rgba(243,198,35,0.12)]"
        />
      </div>

      <div className="w-[42%]" />
    </div>
  );
}
