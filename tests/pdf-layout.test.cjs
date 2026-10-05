require("./register-typescript.cjs");
const test = require("node:test");
const assert = require("node:assert/strict");
const { PDFDocument, PDFName, decodePDFRawStream } = require("pdf-lib");
const { encode } = require("@pdf-lib/upng").default;
const {
  buildScannedPdf,
} = require("../src/modules/documents/infrastructure/buildScannedPdf.ts");

function image(width, height) {
  const pixels = new Uint8Array(width * height * 4).fill(255);
  return new Uint8Array(encode([pixels.buffer], width, height, 0));
}

test("cada recorte ocupa su página completa sin márgenes y conserva orientación y orden", async () => {
  async function* images() {
    yield image(20, 30);
    yield image(40, 20);
  }
  const result = await buildScannedPdf(images());
  const pdf = await PDFDocument.load(result.bytes);
  assert.equal(result.pageCount, 2);
  assert.deepEqual(
    pdf.getPages().map((page) => page.getSize()),
    [
      { width: 7.2, height: 10.8 },
      { width: 14.4, height: 7.2 },
    ],
  );
  for (const page of pdf.getPages()) {
    const stream = page.node.Contents().lookup(0);
    const content = Buffer.from(decodePDFRawStream(stream).decode()).toString();
    const { width, height } = page.getSize();
    assert.ok(content.includes(`${width} 0 0 ${height} 0 0 cm`), content);
    const resources = page.node.Resources().lookup(PDFName.of("XObject"));
    assert.equal(resources.entries().length, 1);
  }
});

test("rechaza imágenes dañadas y documentos vacíos", async () => {
  async function* empty() {}
  async function* invalid() {
    yield new Uint8Array([1, 2, 3]);
  }
  await assert.rejects(buildScannedPdf(empty()), /Agrega al menos/);
  await assert.rejects(buildScannedPdf(invalid()));
});
