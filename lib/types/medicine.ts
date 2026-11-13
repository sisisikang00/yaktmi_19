export type MedicineSource = "easy" | "permit" | "identification";
export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  image?: string;
  source: MedicineSource;
  shape?: string;
  color?: string;
  imprint?: string;
  category?: string;
  form?: string;
  barcode?: string;
}
export interface MedicineDetail extends Medicine {
  efficacy?: string;
  dosage?: string;
  warnings?: string;
  precautions?: string;
  interactions?: string;
  sideEffects?: string;
  storage?: string;
  ingredients?: string;
  permitDate?: string;
  permitKind?: string;
  cancelStatus?: string;
  updatedAt?: string;
  sourceErrors: string[];
}
export interface SearchResult {
  items: Medicine[];
  page: number;
  pageSize: number;
  total: number;
}
export interface IdentificationResult {
  items: Medicine[];
  nextPage: number | null;
  scanned: number;
  startPage: number;
  endPage: number;
}
export interface ApiFailure { error: { code: string; message: string } }

