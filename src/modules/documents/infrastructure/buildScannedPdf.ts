import { PDFDocument } from "pdf-lib";

// Embed the scanner output directly, without HTML printing, margins or JPEG
// recompression. Each crop defines its page size, including landscape pages.
export async function buildScannedPdf(images: AsyncIterable<Uint8Array>) {
  const pdf = await PDFDocument.create();
  pdf.setCreator("Mi Escáner PDF");
  for await (const bytes of images) {
    const image =
      bytes[0] === 0x89 && bytes[1] === 0x50
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
    const width = (image.width * 72) / 200;
    const height = (image.height * 72) / 200;
    const page = pdf.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }
  if (!pdf.getPageCount()) throw new Error("Agrega al menos una hoja.");
  return { bytes: await pdf.save(), pageCount: pdf.getPageCount() };
}
