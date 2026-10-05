require("./register-typescript.cjs");
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL, fileURLToPath } = require("node:url");
const Module = require("node:module");

const cache = path.resolve(__dirname, "../.cache/tests");
fs.mkdirSync(cache, { recursive: true });
const root = fs.mkdtempSync(path.join(cache, "storage-"));
let documentPath = path.join(root, "documents-home");
const resolve = (...parts) =>
  path.join(
    ...parts.map((part) =>
      typeof part === "string"
        ? part.startsWith("file:")
          ? fileURLToPath(part)
          : part
        : part.path,
    ),
  );
// Delayed copies deliberately reproduce SDK 57's asynchronous File.copy/move API.
class File {
  constructor(...parts) {
    this.path = resolve(...parts);
  }
  get uri() {
    return pathToFileURL(this.path).href;
  }
  get exists() {
    return fs.existsSync(this.path);
  }
  get size() {
    return fs.statSync(this.path).size;
  }
  write(content) {
    fs.writeFileSync(this.path, content);
  }
  async text() {
    return fs.promises.readFile(this.path, "utf8");
  }
  async copy(target) {
    await new Promise((done) => setTimeout(done, 2));
    await fs.promises.copyFile(
      this.path,
      target.path,
      fs.constants.COPYFILE_EXCL,
    );
  }
  async move(target, options) {
    await new Promise((done) => setTimeout(done, 2));
    if (target.exists && !options?.overwrite)
      throw new Error("Destination exists");
    await fs.promises.rename(this.path, target.path);
    this.path = target.path;
  }
  open() {
    const fd = fs.openSync(this.path, "r");
    return {
      readBytes(length) {
        const buffer = Buffer.alloc(length);
        fs.readSync(fd, buffer, 0, length, 0);
        return buffer;
      },
      close() {
        fs.closeSync(fd);
      },
    };
  }
}
class Directory {
  constructor(...parts) {
    this.path = resolve(...parts);
  }
  get uri() {
    return pathToFileURL(this.path).href;
  }
  get exists() {
    return fs.existsSync(this.path);
  }
  create(options = {}) {
    if (this.exists && options.idempotent) return;
    fs.mkdirSync(this.path, { recursive: !!options.intermediates });
  }
  list() {
    return fs
      .readdirSync(this.path, { withFileTypes: true })
      .map((item) =>
        item.isDirectory()
          ? new Directory(this, item.name)
          : new File(this, item.name),
      );
  }
  delete() {
    assert.ok(path.resolve(this.path).startsWith(root + path.sep));
    fs.rmSync(this.path, { recursive: true });
  }
}
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  return name === "expo-file-system"
    ? {
        File,
        Directory,
        Paths: {
          get document() {
            return pathToFileURL(documentPath).href;
          },
        },
      }
    : originalLoad.call(this, name, ...args);
};
const {
  LocalDocumentRepository,
} = require("../src/modules/documents/infrastructure/LocalDocumentRepository.ts");
Module._load = originalLoad;
after(() => {
  assert.ok(root.startsWith(cache + path.sep));
  fs.rmSync(root, { recursive: true });
});

function fixture(name, content) {
  const file = new File(root, name);
  file.write(content);
  return file.uri;
}

test("espera las copias; dos nombres iguales no sobrescriben los archivos", async () => {
  const repo = new LocalDocumentRepository();
  const uri = fixture("source.pdf", "%PDF-1.7\nfixture");
  const first = await repo.save({
    name: "Factura",
    pdfUri: uri,
    pageCount: 2,
    source: "import",
  });
  const second = await repo.save({
    name: "Factura",
    pdfUri: uri,
    pageCount: 1,
    source: "import",
  });
  assert.notEqual(first.id, second.id);
  assert.equal((await repo.list()).length, 2);
  await Promise.all([
    repo.rename(first.id, "Factura de luz"),
    repo.setPageCount(first.id, 3),
  ]);
  const updated = (await repo.list()).find((item) => item.id === first.id);
  assert.equal(updated.name, "Factura de luz");
  assert.equal(updated.pageCount, 3);
});

test("rechaza una falsa extensión PDF sin dejar un registro incompleto", async () => {
  const repo = new LocalDocumentRepository();
  const previous = (await repo.list()).length;
  await assert.rejects(
    repo.save({
      name: "Falso",
      pdfUri: fixture("fake.pdf", "this is not a PDF"),
      pageCount: null,
      source: "import",
    }),
    /PDF válido/,
  );
  assert.equal((await repo.list()).length, previous);
});

test("conserva el borrador, sus hojas y el nombre entre sesiones", async () => {
  const repo = new LocalDocumentRepository();
  const pages = await repo.stagePages([
    {
      id: "page-test",
      uri: fixture("page.jpg", "image fixture"),
      width: 100,
      height: 150,
    },
  ]);
  await repo.writeDraft({ name: "Mi documento", pages });
  await repo.writeDraft({ name: "Mi documento final", pages });
  const restored = await new LocalDocumentRepository().readDraft();
  assert.equal(restored.name, "Mi documento final");
  assert.equal(restored.pages.length, 1);
  assert.ok(new File(restored.pages[0].uri).exists);
  await repo.clearDraft();
  assert.deepEqual(await repo.readDraft(), { name: "", pages: [] });
});

test("recupera un manifiesto cuya promoción fue interrumpida", async () => {
  const repo = new LocalDocumentRepository();
  const document = (await repo.list())[0];
  const directory = path.dirname(fileURLToPath(document.pdfUri));
  fs.renameSync(
    path.join(directory, "document.json"),
    path.join(directory, "document.json.pending"),
  );
  assert.ok((await repo.list()).some((item) => item.id === document.id));
  await repo.rename(document.id, "Recuperado");
  assert.equal(
    (await repo.list()).find((item) => item.id === document.id).name,
    "Recuperado",
  );
});

test("reconstruye rutas al cambiar el directorio de instalación", async () => {
  const repo = new LocalDocumentRepository();
  const previous = documentPath;
  documentPath = path.join(root, "restored-home");
  fs.cpSync(previous, documentPath, { recursive: true });
  const documents = await repo.list();
  assert.ok(documents.length > 0);
  assert.ok(
    documents.every((item) =>
      fileURLToPath(item.pdfUri).startsWith(documentPath),
    ),
  );
  await repo.remove(documents[0].id);
  assert.equal((await repo.list()).length, documents.length - 1);
});
