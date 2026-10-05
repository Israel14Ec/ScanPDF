import { File, Paths } from "expo-file-system";
import { buildScannedPdf } from "./buildScannedPdf";
import type { PdfGenerator } from "../domain/ports";
import type { DocumentPage } from "../domain/Document";

export class ExpoPdfGenerator implements PdfGenerator {
  async generate(pages: DocumentPage[]) {
    async function* images() {
      for (const page of pages) yield await new File(page.uri).bytes();
    }
    const generated = await buildScannedPdf(images());
    const output = new File(
      Paths.cache,
      `scan-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
    );
    try {
      output.create();
      output.write(generated.bytes);
      return { uri: output.uri, pageCount: generated.pageCount };
    } catch (error) {
      if (output.exists) output.delete();
      throw error;
    }
  }
}
