// Feronerie (hardware) — informational cards shown on /materiale. No dedicated
// pages for now; each card just presents a system we build with (mostly Blum).
// `image` is optional — drop a real product photo in /public/hardware/ and set
// it to replace the icon treatment.

export type Hardware = {
  slug: string;
  kind: string; // what it is: "Balamale", "Sertare", ...
  name: string; // product line
  brand: string;
  description: string;
  icon: string; // lucide-react name, resolved by MaterialIcon
  accent: string;
  image?: string;
};

export const hardware: Hardware[] = [
  {
    slug: "clip-top-blumotion",
    kind: "Balamale",
    name: "CLIP top BLUMOTION",
    brand: "Blum",
    description:
      "Balamale cu amortizare integrată — ușa se închide lin și silențios de fiecare dată, fără trântit. Montaj și reglaj rapid, fără scule.",
    icon: "DoorClosed",
    accent: "#6B7078",
    image: "/hardware/clip-top-blumotion.webp",
  },
  {
    slug: "legrabox",
    kind: "Sertare",
    name: "LEGRABOX",
    brand: "Blum",
    description:
      "Sertare cu pereți fini din metal și o linie dreaptă, elegantă. Portanță mare, glisare catifelată și un interior curat, generos.",
    icon: "Package",
    accent: "#7C7A54",
    image: "/hardware/legrabox.webp",
  },
  {
    slug: "tandem",
    kind: "Ghidaje",
    name: "TANDEM",
    brand: "Blum",
    description:
      "Ghidaje ascunse cu extragere completă și amortizare. Sertarul iese în întregime, fără efort, și se închide singur pe ultima porțiune.",
    icon: "ArrowLeftRight",
    accent: "#8A7A66",
    image: "/hardware/tandem.webp",
  },
  {
    slug: "aventos",
    kind: "Mecanisme de ridicare",
    name: "AVENTOS",
    brand: "Blum",
    description:
      "Uși verticale care se ridică și rămân suspendate exact unde vrei. Acces liber deasupra blatului, fără uși care se lovesc de cap.",
    icon: "PanelTopOpen",
    accent: "#5E636B",
    image: "/hardware/aventos.webp",
  },
  {
    slug: "servo-drive",
    kind: "Deschidere electrică",
    name: "SERVO-DRIVE",
    brand: "Blum",
    description:
      "Atingi ușor frontul și sertarul sau ușa se deschid singure. Ideal pentru bucătării fără mânere, cu fronturi complet netede.",
    icon: "Zap",
    accent: "#C06A3E",
    image: "/hardware/servo-drive.webp",
  },
  {
    slug: "tip-on",
    kind: "Deschidere prin apăsare",
    name: "TIP-ON",
    brand: "Blum",
    description:
      "Mecanic, fără mâner și fără electricitate: apeși ușor frontul și se deschide. Linie minimalistă, perfectă pentru design curat.",
    icon: "Hand",
    accent: "#6E6A62",
    image: "/hardware/tip-on.webp",
  },
];
