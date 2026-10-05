import { normalizeDocumentName, type DocumentPage } from "../domain/Document";
import type {
  DocumentRepository,
  PdfGenerator,
  PdfPicker,
  FileSharer,
} from "../domain/ports";

export class DocumentUseCases {
  constructor(
    readonly repository: DocumentRepository,
    private pdf: PdfGenerator,
    private picker: PdfPicker,
    private sharer: FileSharer,
  ) {}

  async saveScan(name: string, pages: DocumentPage[]) {
    const validName = normalizeDocumentName(name);
    if (!pages.length) throw new Error("Agrega al menos una hoja.");
    const generated = await this.pdf.generate(pages);
    return this.repository.save({
      name: validName,
      pdfUri: generated.uri,
      pageCount: generated.pageCount,
      thumbnailUri: pages[0].uri,
      source: "scan",
    });
  }

  async importPdf(uri: string, name: string) {
    if (!/^(file|content):\/\//i.test(uri))
      throw new Error("Selecciona un PDF guardado en el teléfono.");
    return this.repository.save({
      name: normalizeDocumentName(name),
      pdfUri: uri,
      pageCount: null,
      source: "import",
    });
  }

  async pickPdf() {
    const selected = await this.picker.pick();
    return selected ? this.importPdf(selected.uri, selected.name) : null;
  }

  async share(id: string) {
    const document = (await this.repository.list()).find(
      (item) => item.id === id,
    );
    if (!document) throw new Error("No encontramos este documento.");
    await this.sharer.share(document);
  }

  rename(id: string, name: string) {
    return this.repository.rename(id, normalizeDocumentName(name));
  }
}
