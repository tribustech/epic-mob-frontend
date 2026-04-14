"use client";

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { Observer } from "gsap/dist/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, CustomEase, Observer);

  if (!gsap.parseEase("epicTextHover")) {
    CustomEase.create("epicTextHover", "M0,0 C0.8,0 0.28,1 1,1");
  }
}

export { CustomEase, gsap, Observer, ScrollTrigger };
