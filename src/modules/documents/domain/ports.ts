import type { Document, DocumentDraft, DocumentPage } from "./Document";

export interface PdfGenerator {
  generate(pages: DocumentPage[]): Promise<{ uri: string; pageCount: number }>;
}
export interface FileSharer {
  share(document: Document): Promise<void>;
}
export interface PdfPicker {
  pick(): Promise<{ uri: string; name: string } | null>;
}
export interface DocumentRepository {
  list(): Promise<Document[]>;
  save(input: {
    name: string;
    pdfUri: string;
    pageCount: number | null;
    thumbnailUri?: string;
    source: Document["source"];
  }): Promise<Document>;
  rename(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;
  setPageCount(id: string, count: number): Promise<void>;
  readDraft(): Promise<DocumentDraft>;
  writeDraft(draft: DocumentDraft): Promise<void>;
  stagePages(pages: DocumentPage[]): Promise<DocumentPage[]>;
  clearDraft(): Promise<void>;
}
