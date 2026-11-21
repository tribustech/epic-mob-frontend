export type AtelierCategory = 'DRESSING' | 'COMODA' | 'SEPARATOR' | 'SUSPENDAT' | 'BUCATARIE';
export type ColumnContent =
  | 'POLITE' | 'BARA' | 'BARA_DUBLA' | 'POLITE_BARA' | 'BARA_SERTARE'   // dressing
  | 'SERTARE' | 'USI' | 'DESCHIS' | 'USA_RIDICABILA'                    // comodă / separator / suspendat
  // bucătărie: module jos (sub blat) și coloane înalte; PLITA = plită pe sertare (cuptorul e în coloană); COLT = corpul de colț al bucătăriei în L (pus automat)
  | 'CHIUVETA' | 'CUPTOR' | 'PLITA' | 'MASINA_VASE' | 'FRIGIDER' | 'COLOANA_CUPTOR' | 'COLOANA' | 'COLT';
/** Bucătărie: ce stă deasupra unui modul de jos (pe perete). HOTA = corp mai scurt cu hota sub el. */
export type UpperContent = 'USI' | 'RIDICABILA' | 'DESCHIS' | 'HOTA' | 'NONE';
/** Bucătărie: forma. L_STANGA / L_DREAPTA = al doilea perete e la stânga / la dreapta peretelui principal. */
export type KitchenLayout = 'LINIAR' | 'L_STANGA' | 'L_DREAPTA';
export interface AtelierKitchen {
  layout: KitchenLayout;
  /** doar în L: al doilea perete — lungimea lui măsurată din colț (cu tot cu adâncimea blatului din colț)
   *  și modulele lui, de la stânga la dreapta privind peretele */
  legB?: { widthMm: number; columns: AtelierColumn[] };
  /** blatul (Cataloage → materiale de tip blat) */
  worktopId?: string;
  /** bandă LED sub corpurile de sus */
  led?: boolean;
}
export interface AtelierColumn {
  widthMm: number; content: ColumnContent;
  shelves?: number;                 // 0–15
  drawers?: 1 | 2 | 3 | 4 | 5 | 6;  // BARA_SERTARE: 1–3; SERTARE: 2–6
  railPosition?: RailPosition;      // doar POLITE_BARA: unde stă bara (implicit SUS)
  doorRows?: 1 | 2 | 3;             // doar dressing cu uși batante: uși pe înălțime (implicit 1)
  doorsAcross?: 1 | 2;              // doar dressing cu uși batante: uși pe lățime (implicit 1)
  upper?: UpperContent;             // doar bucătărie: corpul de sus (implicit USI; peste plită HOTA)
}
/** POLITE_BARA: SUS = bara sus și polițele jos; JOS = polițele sus și bara jos (haine scurte). */
export type RailPosition = 'SUS' | 'JOS';
/** Separator: partea de jos, pe toată lățimea — sertare Tandembox sau o ușă batantă pe coloană, cu PFL în spate. */
export type BottomType = 'NONE' | 'SERTARE' | 'USI';
export interface AtelierBottom {
  type: BottomType;
  heightMm?: number;      // de la podea (cu picioare); implicit 700
  drawers?: 1 | 2 | 3;    // SERTARE; implicit 2
  shelves?: number;       // USI: polițe în spatele ușilor, 0–4; implicit 1
}
export type FrontKind = 'PAL' | 'MDF_MELAMINAT' | 'MDF_VOPSIT';
export interface AtelierFronts { kind: FrontKind; materialId?: string; modelId?: string; ralCode?: string; faces?: 1 | 2 }
export type DoorType =
  | 'NONE'
  | 'GLISANTE' | 'GLISANTE_OGLINDA' | 'GLISANTE_STICLA'
  | 'BATANTE' | 'BATANTE_OGLINDA' | 'BATANTE_STICLA';   // oglinda / sticla: lipite pe o foaie de PAL din materialul corpului
/** Mânerul fronturilor (uși și sertare). Modelul exact al mânerului aplicat se stabilește la măsurători. */
export type HandleKind = 'APLICAT' | 'BUTON' | 'INGROPAT' | 'PROFIL_J' | 'GOLA' | 'PUSH';
/** Culoarea mânerului vizibil — informativă (ajunge în nota cererii), fără efect pe preț. */
export type HandleFinish = 'NEGRU' | 'INOX' | 'AURIU';
export interface AtelierHandle { type: HandleKind; finish?: HandleFinish }
/** Fața unei uși. */
export type DoorFill = 'PANOU' | 'OGLINDA' | 'STICLA';
export interface AtelierDoors {
  type: DoorType;        // *_OGLINDA / *_STICLA = toate ușile au fața aceea
  count?: number;        // doar la glisante
  /** fața pe fiecare ușă, peste cea din `type`. Glisante: index = ușa (stânga→dreapta); batante: index = coloana.
   *  Lipsă / mai scurt = fața din `type`. */
  fills?: DoorFill[];
  mirrorId?: string;     // catalog.glass.mirrors[].id; lipsă = tariful vechi din setări
  glassId?: string;      // catalog.glass.glasses[].id; lipsă = tariful vechi din setări
}
/** Un tip de oglindă / sticlă din Cataloage, fără preț. */
export interface AtelierGlass { id: string; name: string; tint: string; matte?: boolean; opaque?: boolean }
export interface AtelierConfig {
  category: AtelierCategory;
  widthMm: number; heightMm: number; depthMm: number;
  columns: AtelierColumn[];
  carcassMaterialId: string;
  fronts: AtelierFronts;
  legsMm: 0 | 100 | 150;           // 0 doar la SUSPENDAT; 100 | 150 la restul
  doors: AtelierDoors;   // în afara DRESSING: { type: 'NONE' }; count doar la glisante
  bottom?: AtelierBottom;          // doar SEPARATOR: partea de jos (lipsă = deschis până jos)
  handle?: AtelierHandle;          // fronturile cu mâner (comodă, suspendat, dressing cu uși batante); lipsă = implicitul categoriei
  kitchen?: AtelierKitchen;        // doar BUCATARIE: forma, al doilea perete, blatul, LED
}
export interface AtelierIssue { code: string; message: string; column?: number }
/** Electrocasnicele și chiuveta desenate în 3D (nu intră în preț). */
export type ApplianceKind = 'CHIUVETA' | 'PLITA' | 'CUPTOR' | 'MICROUNDE' | 'FRIGIDER' | 'HOTA';
export interface ScenePiece {
  x: number; y: number; z: number; w: number; h: number; d: number; role: 'CORP' | 'FRONT' | 'SPATE' | 'PLINTA' | 'BLAT' | 'APARAT';
  /** doar role APARAT */
  appliance?: ApplianceKind;
  /** bucătărie în L: piesa stă pe al doilea perete (coordonatele lui; vezi AtelierScene.kitchen) */
  leg?: 'B';
  /** doar ușile batante: latura cu balamale (L/R) sau sus (T, ușă rabatabilă) — pentru animația de deschidere */
  hinge?: 'L' | 'R' | 'T';
  /** ușile batante cu oglindă / sticlă (lipite pe PAL) */
  fill?: 'OGLINDA' | 'STICLA';
  /** doar role FRONT: ușă, front de sertar sau front fix (nu se deschide: front fals, mașina de vase) */
  front?: 'USA' | 'SERTAR' | 'FIX';
  /** aspectul oglinzii / sticlei de pe ușă */
  tint?: string; matte?: boolean; opaque?: boolean;
}
export interface SceneDoor { x: number; w: number; h: number; fill: 'PANOU' | 'OGLINDA' | 'STICLA'; track: 0 | 1; tint?: string; matte?: boolean; opaque?: boolean }
export interface AtelierScene { pieces: ScenePiece[]; doors: SceneDoor[]; widthMm: number; heightMm: number; depthMm: number;
  /** mânerul efectiv al fronturilor */
  handle?: HandleKind | 'FARA';
  /** bucătărie: forma și lungimea celui de-al doilea perete. Piesele cu leg 'B' au x de-a lungul peretelui B
   *  (stânga→dreapta privindu-l) și z de la perete spre cameră; L_STANGA: peretele B e la x = 0 al scenei,
   *  colțul la x = legBLengthMm al lui; L_DREAPTA: peretele B e la x = widthMm, colțul la x = 0 al lui. */
  kitchen?: { layout: KitchenLayout; legBLengthMm?: number } }
export interface AtelierPriceResult { sellPrice: number | null; errors: AtelierIssue[]; warnings: AtelierIssue[]; scene: AtelierScene | null }
export interface AtelierMaterial { id: string; name: string; decorCode: string | null; brand: string | null; imageUrl: string | null }
export interface AtelierCatalog {
  carcass: AtelierMaterial[];                                   // PAL + MDF melaminat cu preț
  fronts: { PAL: AtelierMaterial[]; MDF_MELAMINAT: AtelierMaterial[]; MDF_VOPSIT: { id: string; name: string }[] };
  ral: { code: string; name: string; hex: string }[];
  /** tipurile de mâner care se pot cota acum */
  handles?: { types: { type: HandleKind; label: string }[] };
  /** tipurile de oglindă și sticlă pentru uși */
  glass?: { mirrors: AtelierGlass[]; glasses: AtelierGlass[] };
  /** blaturile de bucătărie (cu grosimea și adâncimea maximă) */
  worktops?: (AtelierMaterial & { thicknessMm: number; maxDepthMm: number })[];
}
export interface AtelierContact { name: string; phone: string; city: string; notes?: string }
