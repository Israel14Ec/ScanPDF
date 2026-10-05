import { Directory, File, Paths } from "expo-file-system";
import type { Document, DocumentDraft, DocumentPage } from "../domain/Document";
import type { DocumentRepository } from "../domain/ports";

/** Independent manifests and staged writes allow recovery after an interrupted move. */
export class LocalDocumentRepository implements DocumentRepository {
  private readonly updates = new Map<string, Promise<void>>();
  private root() {
    const directory = new Directory(Paths.document, "documents");
    directory.create({ idempotent: true, intermediates: true });
    return directory;
  }
  private draftRoot() {
    const directory = new Directory(Paths.document, "draft");
    directory.create({ idempotent: true, intermediates: true });
    return directory;
  }
  private folder(id: string) {
    if (!/^doc-[a-z0-9-]+$/.test(id)) throw new Error("Documento inválido.");
    return new Directory(this.root(), id);
  }
  private async commit(folder: Directory, name: string, value: unknown) {
    const pending = new File(folder, `${name}.pending`);
    pending.write(JSON.stringify(value));
    await pending.move(new File(folder, name), { overwrite: true });
  }
  private manifest(folder: Directory, name: string) {
    const committed = new File(folder, name);
    return committed.exists ? committed : new File(folder, `${name}.pending`);
  }
  async list(): Promise<Document[]> {
    const documents: Document[] = [];
    for (const folder of this.root().list()) {
      if (!(folder instanceof Directory)) continue;
      const manifest = this.manifest(folder, "document.json");
      if (!manifest.exists) continue;
      const record = JSON.parse(await manifest.text()) as Omit<
        Document,
        "pdfUri" | "thumbnailUri"
      >;
      const pdf = new File(folder, "document.pdf");
      if (!record.id || !record.name || !pdf.exists)
        throw new Error("No se pudo leer un documento guardado.");
      const thumbnail = new File(folder, "thumbnail.jpg");
      documents.push({
        ...record,
        pdfUri: pdf.uri,
        thumbnailUri: thumbnail.exists ? thumbnail.uri : undefined,
      });
    }
    return documents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async save(input: {
    name: string;
    pdfUri: string;
    pageCount: number | null;
    thumbnailUri?: string;
    source: Document["source"];
  }) {
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const folder = this.folder(id);
    folder.create();
    try {
      const pdf = new File(folder, "document.pdf");
      await new File(input.pdfUri).copy(pdf);
      const handle = pdf.open();
      let header: Uint8Array;
      try {
        header = handle.readBytes(Math.min(1024, pdf.size));
      } finally {
        handle.close();
      }
      if (!String.fromCharCode(...header).includes("%PDF-"))
        throw new Error("El archivo seleccionado no es un PDF válido.");
      const thumbnail = new File(folder, "thumbnail.jpg");
      if (input.thumbnailUri)
        await new File(input.thumbnailUri).copy(thumbnail);
      const record = {
        id,
        name: input.name,
        createdAt: new Date().toISOString(),
        pageCount: input.pageCount,
        size: pdf.size,
        source: input.source,
      };
      await this.commit(folder, "document.json", record);
      return {
        ...record,
        pdfUri: pdf.uri,
        thumbnailUri: thumbnail.exists ? thumbnail.uri : undefined,
      };
    } catch (error) {
      folder.delete();
      throw error;
    }
  }
  private update(
    id: string,
    changes: Partial<Pick<Document, "name" | "pageCount">>,
  ) {
    const pending = (this.updates.get(id) ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const folder = this.folder(id);
        const record = JSON.parse(
          await this.manifest(folder, "document.json").text(),
        );
        await this.commit(folder, "document.json", { ...record, ...changes });
      });
    this.updates.set(id, pending);
    void pending
      .finally(() => {
        if (this.updates.get(id) === pending) this.updates.delete(id);
      })
      .catch(() => {});
    return pending;
  }
  rename(id: string, name: string) {
    return this.update(id, { name });
  }
  setPageCount(id: string, pageCount: number) {
    return this.update(id, { pageCount });
  }
  async remove(id: string) {
    await this.updates.get(id)?.catch(() => {});
    const folder = this.folder(id);
    if (folder.exists) folder.delete();
  }
  async readDraft(): Promise<DocumentDraft> {
    const folder = this.draftRoot();
    const file = this.manifest(folder, "draft.json");
    if (!file.exists) return { name: "", pages: [] };
    const draft = JSON.parse(await file.text()) as DocumentDraft;
    return {
      name: draft.name,
      pages: draft.pages
        .map((page) => ({
          ...page,
          uri: new File(folder, `${page.id}.jpg`).uri,
        }))
        .filter((page) => new File(page.uri).exists),
    };
  }
  async writeDraft(draft: DocumentDraft) {
    await this.commit(this.draftRoot(), "draft.json", draft);
  }
  async stagePages(pages: DocumentPage[]) {
    const staged: DocumentPage[] = [];
    for (const page of pages) {
      const destination = new File(this.draftRoot(), `${page.id}.jpg`);
      await new File(page.uri).copy(destination);
      staged.push({ ...page, uri: destination.uri });
    }
    return staged;
  }
  async clearDraft() {
    const directory = this.draftRoot();
    directory.delete();
  }
}
