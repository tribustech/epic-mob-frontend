import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://epicmob.ro"),
  title: {
    default: "Epic Mob Atelier — Mobilier la comanda",
    // Child pages set just their descriptive part; the brand is appended here.
    template: "%s | Epic Mob",
  },
  description:
    "Mobilier premium la comanda, consultanta si executie cap-coada pentru proiecte rezidentiale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${displayFont.variable} ${bodyFont.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full bg-bg text-navy antialiased">
        <SiteHeader />
        <div className="relative">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
