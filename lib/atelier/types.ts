export type ColumnContent = 'POLITE' | 'BARA' | 'BARA_DUBLA' | 'POLITE_BARA' | 'BARA_SERTARE';
export interface AtelierColumn { widthMm: number; content: ColumnContent; shelves?: number; drawers?: 1 | 2 | 3 }
export type FrontKind = 'PAL' | 'MDF_MELAMINAT' | 'MDF_VOPSIT';
export interface AtelierFronts { kind: FrontKind; materialId?: string; modelId?: string; ralCode?: string; faces?: 1 | 2 }
export type DoorType = 'NONE' | 'GLISANTE' | 'GLISANTE_OGLINDA' | 'GLISANTE_STICLA';
export interface AtelierConfig {
  category: 'DRESSING';
  widthMm: number; heightMm: number; depthMm: number;
  columns: AtelierColumn[];
  carcassMaterialId: string;
  fronts: AtelierFronts;
  legsMm: 100 | 150;
  doors: { type: DoorType; count?: number };
}
export interface AtelierIssue { code: string; message: string; column?: number }
export interface ScenePiece { x: number; y: number; z: number; w: number; h: number; d: number; role: 'CORP' | 'FRONT' | 'SPATE' | 'PLINTA' }
export interface SceneDoor { x: number; w: number; h: number; fill: 'PANOU' | 'OGLINDA' | 'STICLA'; track: 0 | 1 }
export interface AtelierScene { pieces: ScenePiece[]; doors: SceneDoor[]; widthMm: number; heightMm: number; depthMm: number }
export interface AtelierPriceResult { sellPrice: number | null; errors: AtelierIssue[]; warnings: AtelierIssue[]; scene: AtelierScene | null }
export interface AtelierMaterial { id: string; name: string; decorCode: string | null; brand: string | null; imageUrl: string | null }
export interface AtelierCatalog {
  carcass: AtelierMaterial[];                                   // PAL + MDF melaminat cu preț
  fronts: { PAL: AtelierMaterial[]; MDF_MELAMINAT: AtelierMaterial[]; MDF_VOPSIT: { id: string; name: string }[] };
  ral: { code: string; name: string; hex: string }[];
}
export interface AtelierContact { name: string; phone: string; city: string; notes?: string }
