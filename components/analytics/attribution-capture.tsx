"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

// Remembers which ad / UTM link brought the visitor (lib/attribution.ts), so the
// finished request reaches the CRM with its source. Runs once per page load:
// campaign parameters are only on the landing URL.
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
