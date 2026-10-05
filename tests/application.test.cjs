require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  DocumentUseCases,
} = require("../src/modules/documents/application/DocumentUseCases.ts");
const { movePage } = require("../src/modules/documents/domain/Document.ts");
const {
  ScanPages,
} = require("../src/modules/scanner/application/ScanPages.ts");
const { redirectSystemPath } = require("../src/app/+native-intent.ts");

function setup() {
  const records = [];
  const calls = [];
  const repository = {
    async list() {
      return records;
    },
    async save(input) {
      calls.push(["save", input]);
      const record = { ...input, id: `doc-${records.length}` };
      records.push(record);
      return record;
    },
    async rename(id, name) {
      records.find((item) => item.id === id).name = name;
    },
  };
  const pdf = {
    async generate(pages) {
      calls.push(["generate", pages.map((page) => page.id)]);
      return { uri: "file:///result.pdf", pageCount: pages.length };
    },
  };
  const picker = {
    async pick() {
      return null;
    },
  };
  const sharer = {
    async share(item) {
      calls.push(["share", item]);
    },
  };
  return {
    service: new DocumentUseCases(repository, pdf, picker, sharer),
    calls,
    records,
    pdf,
    picker,
  };
}

test("no crea un PDF sin nombre o sin hojas", async () => {
  const { service, calls } = setup();
  await assert.rejects(service.saveScan("   ", [{ id: "1" }]), /nombre/);
  await assert.rejects(service.saveScan("Recibos", []), /hoja/);
  assert.equal(calls.length, 0);
});

test("conserva el orden elegido y limpia la extensión del nombre", async () => {
  const { service, calls } = setup();
  const pages = [
    { id: "a", uri: "file:///a.jpg" },
    { id: "b", uri: "file:///b.jpg" },
  ];
  const document = await service.saveScan(
    "  Exámenes.pdf  ",
    movePage(pages, 1, -1),
  );
  assert.deepEqual(calls[0], ["generate", ["b", "a"]]);
  assert.equal(document.name, "Exámenes");
  assert.equal(document.thumbnailUri, "file:///b.jpg");
  assert.equal(document.pageCount, 2);
  assert.deepEqual(
    pages.map((page) => page.id),
    ["a", "b"],
  );
});

test("una generación fallida no guarda un documento incompleto", async () => {
  const { service, pdf, records } = setup();
  pdf.generate = async () => {
    throw new Error("Sin espacio");
  };
  await assert.rejects(
    service.saveScan("Recibos", [{ id: "a" }]),
    /Sin espacio/,
  );
  assert.equal(records.length, 0);
});

test("cancelar el selector o la cámara no crea documentos", async () => {
  const { service, records } = setup();
  assert.equal(await service.pickPdf(), null);
  assert.equal(
    await new ScanPages({
      async scan() {
        return null;
      },
    }).execute(),
    null,
  );
  assert.equal(records.length, 0);
});

test("comparte la copia guardada y rechaza documentos inexistentes", async () => {
  const { service, calls } = setup();
  const document = await service.importPdf(
    "content://provider/123",
    "Factura.pdf",
  );
  await service.share(document.id);
  assert.equal(calls.at(-1)[1].name, "Factura");
  await assert.rejects(service.share("desconocido"), /encontramos/);
  await assert.rejects(
    service.importPdf("https://example.com/a.pdf", "Factura"),
    /teléfono/,
  );
});

test("redirige los PDF externos sin perder el content URI", () => {
  const uri = "content://provider/folder/document%20one.pdf?token=123";
  const route = redirectSystemPath({ path: uri, initial: true });
  assert.equal(
    new URL(route, "https://app.local").searchParams.get("uri"),
    uri,
  );
  assert.equal(
    redirectSystemPath({ path: "miescanerpdf://expo-sharing", initial: true }),
    "/incoming",
  );
  assert.equal(redirectSystemPath({ path: "malformed", initial: true }), "/");
});
