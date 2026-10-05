import type { ScannedPage } from "../../scanner/domain/DocumentScanner";

export type DocumentPage = ScannedPage;
export interface Document {
  id: string;
  name: string;
  createdAt: string;
  pdfUri: string;
  thumbnailUri?: string;
  pageCount: number | null;
  size: number;
  source: "scan" | "import";
}
export interface DocumentDraft {
  name: string;
  pages: DocumentPage[];
}

export function normalizeDocumentName(value: string): string {
  const name = value
    .trim()
    .replace(/\.pdf$/i, "")
    .trim();
  if (!name) throw new Error("Escribe un nombre para el documento.");
  if (name.length > 80)
    throw new Error("El nombre puede tener hasta 80 caracteres.");
  return name;
}

export function movePage(
  pages: DocumentPage[],
  index: number,
  direction: -1 | 1,
): DocumentPage[] {
  const target = index + direction;
  if (
    index < 0 ||
    index >= pages.length ||
    target < 0 ||
    target >= pages.length
  )
    return pages;
  const reordered = [...pages];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
}
