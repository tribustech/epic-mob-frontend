// Iluminat LED — informational cards on /materiale, grouped by how you control
// the strip. Shown with a small profile drawing (see LedProfile), like handles.

export type Led = {
  slug: string;
  name: string;
  description: string;
  accent: string;
  profile: string; // key resolved by LedProfile
};

export const leds: Led[] = [
  {
    slug: "telecomanda",
    name: "Cu telecomandă",
    description:
      "Aprinzi, stingi și reglezi intensitatea sau culoarea de la distanță, cu o telecomandă. Fără să atingi nimic — potrivit pentru bandă ambientală în living și dormitor.",
    accent: "#A5542F",
    profile: "telecomanda",
  },
  {
    slug: "touch",
    name: "Cu touch",
    description:
      "Atingi profilul sau un senzor discret și lumina se aprinde; ții degetul apăsat pentru a regla intensitatea. Elegant și fără telecomandă de pierdut.",
    accent: "#7C7A54",
    profile: "touch",
  },
  {
    slug: "senzor-miscare",
    name: "Cu senzor de mișcare",
    description:
      "Treci mâna prin dreptul senzorului, fără să atingi nimic, și lumina se aprinde. Ideal sub corpurile de bucătărie, când ai mâinile ocupate sau murdare.",
    accent: "#6B7078",
    profile: "senzor-miscare",
  },
  {
    slug: "senzor-usa",
    name: "La deschiderea ușii",
    description:
      "Lumina se aprinde singură când deschizi ușa sau sertarul și se stinge la loc când închizi. Clasicul pentru dressinguri, dulapuri și vitrine.",
    accent: "#8A7A66",
    profile: "senzor-usa",
  },
  {
    slug: "smart",
    name: "Smart / din telefon",
    description:
      "Comanzi banda din aplicație sau prin comandă vocală (Google, Alexa): scene, programare și intensitate, direct de pe telefon.",
    accent: "#C06A3E",
    profile: "smart",
  },
];
