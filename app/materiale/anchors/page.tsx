import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnchorPicker } from "./anchor-picker";

// Developer tool for placing the material diagram anchors. It must never be
// public: production builds answer 404, and the page is noindex in dev too.
export const metadata: Metadata = {
  title: "Anchor picker (dev)",
  robots: { index: false, follow: false },
};

export default function AnchorsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <AnchorPicker />;
}
