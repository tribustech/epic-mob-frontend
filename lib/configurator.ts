export type ConfiguratorMode = "basic" | "advanced";

export const configuratorCatalog = {
  modes: [
    {
      id: "basic" as const,
      label: "Basic",
      description:
        "Pentru clienti care vor sa fie ghidati prin materialele, camerele si pasii de inceput.",
    },
    {
      id: "advanced" as const,
      label: "Advanced",
      description:
        "Pentru clienti care cunosc deja dimensiuni, materiale, finisaje, iluminare si constrangeri tehnice.",
    },
  ],
  roomTypes: [
    { id: "bucatarie", label: "Bucatarie" },
    { id: "baie", label: "Baie" },
    { id: "dressing", label: "Dressing" },
    { id: "living", label: "Living" },
    { id: "dormitor", label: "Dormitor" },
    { id: "birou", label: "Birou" },
    { id: "hol", label: "Hol" },
  ],
  materialFamilies: [
    { id: "pal", label: "PAL" },
    { id: "mdf-vopsit", label: "MDF vopsit" },
    { id: "pal-plus-mdf", label: "PAL + fronturi MDF" },
  ],
  finishBrands: [
    {
      id: "egger",
      label: "Egger",
      description: "Structurat ca brand selectabil acum si catalog extensibil ulterior.",
    },
    {
      id: "agt",
      label: "AGT",
      description: "Pregatit pentru viitoare colectii si filtre de finisaj mai detaliate.",
    },
    {
      id: "mdf-vopsit",
      label: "MDF vopsit",
      description: "Pentru proiecte premium care cer libertate cromatica si un finisaj superior.",
    },
  ],
  lightingOptions: [
    { id: "none", label: "Fara LED" },
    { id: "button", label: "Cu buton" },
    { id: "sensor", label: "Cu senzor" },
    { id: "remote", label: "Cu telecomanda" },
    { id: "warm", label: "Alb cald" },
    { id: "cool", label: "Alb rece" },
    { id: "rgb", label: "Colorata" },
  ],
};

export const basicDefaults = {
  mode: "basic" as const,
  rooms: [] as string[],
  plansStatus: "",
  inspirationLinks: "",
  colorDirection: "",
  applianceStatus: "",
  styleDirection: "",
  deadline: "",
  notes: "",
  fullName: "",
  phone: "",
  email: "",
};

export const advancedDefaults = {
  mode: "advanced" as const,
  rooms: [] as string[],
  furnitureDetails: "",
  materials: [] as string[],
  finishBrands: [] as string[],
  lighting: [] as string[],
  applianceDetails: "",
  references: "",
  deadline: "",
  fullName: "",
  phone: "",
  email: "",
};

export type BasicSubmission = typeof basicDefaults;
export type AdvancedSubmission = typeof advancedDefaults;
export type ProjectSubmission = BasicSubmission | AdvancedSubmission;

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseConfiguratorSubmission(
  payload: unknown,
): ProjectSubmission | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const mode = candidate.mode;

  if (mode === "basic") {
    const submission: BasicSubmission = {
      mode,
      rooms: normalizeArray(candidate.rooms),
      plansStatus: typeof candidate.plansStatus === "string" ? candidate.plansStatus.trim() : "",
      inspirationLinks:
        typeof candidate.inspirationLinks === "string"
          ? candidate.inspirationLinks.trim()
          : "",
      colorDirection:
        typeof candidate.colorDirection === "string"
          ? candidate.colorDirection.trim()
          : "",
      applianceStatus:
        typeof candidate.applianceStatus === "string"
          ? candidate.applianceStatus.trim()
          : "",
      styleDirection:
        typeof candidate.styleDirection === "string"
          ? candidate.styleDirection.trim()
          : "",
      deadline: typeof candidate.deadline === "string" ? candidate.deadline.trim() : "",
      notes: typeof candidate.notes === "string" ? candidate.notes.trim() : "",
      fullName:
        typeof candidate.fullName === "string" ? candidate.fullName.trim() : "",
      phone: typeof candidate.phone === "string" ? candidate.phone.trim() : "",
      email: typeof candidate.email === "string" ? candidate.email.trim() : "",
    };

    if (
      submission.rooms.length === 0 ||
      !isNonEmptyString(submission.deadline) ||
      !isNonEmptyString(submission.fullName) ||
      !isNonEmptyString(submission.phone) ||
      !isNonEmptyString(submission.email)
    ) {
      return null;
    }

    return submission;
  }

  if (mode === "advanced") {
    const submission: AdvancedSubmission = {
      mode,
      rooms: normalizeArray(candidate.rooms),
      furnitureDetails:
        typeof candidate.furnitureDetails === "string"
          ? candidate.furnitureDetails.trim()
          : "",
      materials: normalizeArray(candidate.materials),
      finishBrands: normalizeArray(candidate.finishBrands),
      lighting: normalizeArray(candidate.lighting),
      applianceDetails:
        typeof candidate.applianceDetails === "string"
          ? candidate.applianceDetails.trim()
          : "",
      references:
        typeof candidate.references === "string" ? candidate.references.trim() : "",
      deadline: typeof candidate.deadline === "string" ? candidate.deadline.trim() : "",
      fullName:
        typeof candidate.fullName === "string" ? candidate.fullName.trim() : "",
      phone: typeof candidate.phone === "string" ? candidate.phone.trim() : "",
      email: typeof candidate.email === "string" ? candidate.email.trim() : "",
    };

    if (
      submission.rooms.length === 0 ||
      submission.materials.length === 0 ||
      submission.finishBrands.length === 0 ||
      !isNonEmptyString(submission.deadline) ||
      !isNonEmptyString(submission.fullName) ||
      !isNonEmptyString(submission.phone) ||
      !isNonEmptyString(submission.email)
    ) {
      return null;
    }

    return submission;
  }

  return null;
}

export function buildProjectSummary(submission: ProjectSubmission) {
  const lines = [
    `Mod: ${submission.mode === "basic" ? "Basic" : "Advanced"}`,
    `Camere: ${submission.rooms.length > 0 ? submission.rooms.join(", ") : "nespecificate"}`,
    `Deadline: ${submission.deadline || "nespecificat"}`,
  ];

  if (submission.mode === "basic") {
    lines.push(
      `Schite sau masuratori: ${submission.plansStatus || "nespecificat"}`,
      `Inspiratie: ${submission.inspirationLinks || "nespecificat"}`,
      `Culori: ${submission.colorDirection || "nespecificat"}`,
      `Electrocasnice: ${submission.applianceStatus || "nespecificat"}`,
      `Stil: ${submission.styleDirection || "nespecificat"}`,
    );
  } else {
    lines.push(
      `Corpuri si dimensiuni: ${submission.furnitureDetails || "nespecificat"}`,
      `Materiale: ${submission.materials.join(", ")}`,
      `Finisaje / branduri: ${submission.finishBrands.join(", ")}`,
      `Iluminare: ${submission.lighting.length > 0 ? submission.lighting.join(", ") : "nespecificat"}`,
      `Electrocasnice: ${submission.applianceDetails || "nespecificat"}`,
      `Referinte: ${submission.references || "nespecificat"}`,
      "Feronerie: Blum",
    );
  }

  lines.push(
    `Contact: ${submission.fullName}`,
    `Telefon: ${submission.phone}`,
    `Email: ${submission.email}`,
  );

  return lines.join("\n");
}
