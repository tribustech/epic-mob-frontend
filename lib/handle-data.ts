// Tipuri de mânere — informational cards on /materiale. Each type shows a real
// product photo (`image`); the profile drawing (see HandleProfile) stays as a
// fallback for any entry without a photo, since the grip shape is what matters.

export type Handle = {
  slug: string;
  name: string;
  description: string;
  accent: string;
  profile: string; // key resolved by HandleProfile (fallback when no image)
  image?: string; // product photo in /public/handles/
};

export const handles: Handle[] = [
  {
    slug: "aplicat",
    name: "Mâner aplicat",
    description:
      "Bara clasică prinsă pe front — bară, reling sau scoică. Prezență puternică, prindere fermă și ușor de schimbat oricând.",
    accent: "#A5542F",
    profile: "aplicat",
    image: "/handles/aplicat.webp",
  },
  {
    slug: "profil-j",
    name: "Profil J (freză J)",
    description:
      "Muchia frontului e frezată în formă de J, iar degetele prind în spatele ei. Fără mâner vizibil, o linie continuă și curată.",
    accent: "#7C7A54",
    profile: "profil-j",
    image: "/handles/profil-j.webp",
  },
  {
    slug: "gola",
    name: "Sistem GOLA",
    description:
      "Un profil de aluminiu integrat între corpuri ține loc de mâner. Fronturi complet netede și o linie orizontală elegantă.",
    accent: "#6B7078",
    profile: "gola",
    image: "/handles/gola.webp",
  },
  {
    slug: "buton",
    name: "Buton",
    description:
      "Mâner punctual, rotund sau pătrat. Accent clasic, rustic sau retro pentru fronturi cu caracter și simetrie.",
    accent: "#8A7A66",
    profile: "buton",
    image: "/handles/buton.webp",
  },
  {
    slug: "ingropat",
    name: "Mâner îngropat",
    description:
      "Scobit direct în grosimea frontului. Discret, plan cu suprafața, fără nimic ieșit în afară — perfect pentru spații de trecere.",
    accent: "#5E636B",
    profile: "ingropat",
    image: "/handles/ingropat.webp",
  },
  {
    slug: "push",
    name: "Fără mâner (push)",
    description:
      "Niciun mâner: apeși ușor frontul și se deschide, cu mecanism TIP-ON. Minimalism total, suprafețe perfect netede.",
    accent: "#C06A3E",
    profile: "push",
    image: "/handles/push.webp",
  },
];
