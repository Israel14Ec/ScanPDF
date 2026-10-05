import { Directory, File, Paths } from "expo-file-system";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import type { Document } from "../domain/Document";
import type { FileSharer } from "../domain/ports";

export class ExpoFileSharer implements FileSharer {
  async share(document: Document) {
    if (!(await isAvailableAsync()))
      throw new Error("Este dispositivo no permite compartir archivos.");
    const folder = new Directory(
      Paths.cache,
      "shared",
      `${document.id}-${Date.now()}`,
    );
    folder.create({ intermediates: true });
    const filename =
      document.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim() ||
      "Documento";
    const copy = new File(folder, `${filename}.pdf`);
    await new File(document.pdfUri).copy(copy);
    await shareAsync(copy.uri, {
      mimeType: "application/pdf",
      dialogTitle: "Enviar PDF por WhatsApp u otra aplicación",
    });
    // Keep the copy in cache: the receiving app may still be reading it.
  }
}
