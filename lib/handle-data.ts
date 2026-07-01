// Tipuri de mânere — informational cards on /materiale. Each type is shown with
// a small profile drawing (see HandleProfile) rather than a photo, because what
// distinguishes them is the shape of the grip, not a product shot.

export type Handle = {
  slug: string;
  name: string;
  description: string;
  accent: string;
  profile: string; // key resolved by HandleProfile
};

export const handles: Handle[] = [
  {
    slug: "aplicat",
    name: "Mâner aplicat",
    description:
      "Bara clasică prinsă pe front — bară, reling sau scoică. Prezență puternică, prindere fermă și ușor de schimbat oricând.",
    accent: "#A5542F",
    profile: "aplicat",
  },
  {
    slug: "profil-j",
    name: "Profil J (freză J)",
    description:
      "Muchia frontului e frezată în formă de J, iar degetele prind în spatele ei. Fără mâner vizibil, o linie continuă și curată.",
    accent: "#7C7A54",
    profile: "profil-j",
  },
  {
    slug: "gola",
    name: "Sistem GOLA",
    description:
      "Un profil de aluminiu integrat între corpuri ține loc de mâner. Fronturi complet netede și o linie orizontală elegantă.",
    accent: "#6B7078",
    profile: "gola",
  },
  {
    slug: "buton",
    name: "Buton",
    description:
      "Mâner punctual, rotund sau pătrat. Accent clasic, rustic sau retro pentru fronturi cu caracter și simetrie.",
    accent: "#8A7A66",
    profile: "buton",
  },
  {
    slug: "ingropat",
    name: "Mâner îngropat",
    description:
      "Scobit direct în grosimea frontului. Discret, plan cu suprafața, fără nimic ieșit în afară — perfect pentru spații de trecere.",
    accent: "#5E636B",
    profile: "ingropat",
  },
  {
    slug: "push",
    name: "Fără mâner (push)",
    description:
      "Niciun mâner: apeși ușor frontul și se deschide, cu mecanism TIP-ON. Minimalism total, suprafețe perfect netede.",
    accent: "#C06A3E",
    profile: "push",
  },
];
