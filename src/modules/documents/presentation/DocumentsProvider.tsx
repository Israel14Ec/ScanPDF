import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  documentUseCases,
  repository,
  scanPages,
} from "@/composition/dependencies";
import {
  movePage,
  type Document,
  type DocumentDraft,
} from "../domain/Document";

function useDocumentsState() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [draft, setDraft] = useState<DocumentDraft>({ name: "", pages: [] });
  const draftRef = useRef(draft);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const writes = useRef(Promise.resolve());

  async function reload() {
    setDocuments(await repository.list());
  }
  useEffect(() => {
    let alive = true;
    Promise.all([repository.list(), repository.readDraft()])
      .then(([items, restored]) => {
        if (alive) {
          setDocuments(items);
          draftRef.current = restored;
          setDraft(restored);
          setReady(true);
        }
      })
      .catch(() => {
        if (alive)
          setError(
            "No se pudieron leer tus documentos. Vuelve a abrir la aplicación.",
          );
      });
    return () => {
      alive = false;
    };
  }, []);
  function updateDraft(next: DocumentDraft) {
    draftRef.current = next;
    setDraft(next);
    const persisted = writes.current
      .catch(() => {})
      .then(() => repository.writeDraft(next));
    writes.current = persisted;
    void persisted.catch(() =>
      setError(
        "No se pudo guardar el borrador. Comprueba el espacio disponible.",
      ),
    );
  }
  async function run<T>(
    label: string,
    action: () => Promise<T>,
  ): Promise<T | undefined> {
    if (locked.current || !ready) return undefined;
    locked.current = true;
    setBusy(label);
    setError(null);
    try {
      return await action();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Ocurrió un problema. Inténtalo de nuevo.",
      );
      return undefined;
    } finally {
      locked.current = false;
      setBusy(null);
    }
  }
  return {
    documents,
    draft,
    ready,
    busy,
    error,
    clearError: () => setError(null),
    setName: (name: string) => updateDraft({ ...draftRef.current, name }),
    reorder: (index: number, direction: -1 | 1) =>
      updateDraft({
        ...draftRef.current,
        pages: movePage(draftRef.current.pages, index, direction),
      }),
    removePage: (id: string) =>
      updateDraft({
        ...draftRef.current,
        pages: draftRef.current.pages.filter((page) => page.id !== id),
      }),
    scan: () =>
      run("Preparando el escáner…", async () => {
        const pages = await scanPages.execute();
        if (!pages) return false;
        const staged = await repository.stagePages(pages);
        updateDraft({
          ...draftRef.current,
          pages: [...draftRef.current.pages, ...staged],
        });
        await writes.current;
        return true;
      }),
    save: () =>
      run("Creando tu PDF…", async () => {
        await writes.current.catch(() =>
          repository.writeDraft(draftRef.current),
        );
        const saved = await documentUseCases.saveScan(
          draftRef.current.name,
          draftRef.current.pages,
        );
        await repository.clearDraft();
        draftRef.current = { name: "", pages: [] };
        setDraft(draftRef.current);
        await reload();
        return saved;
      }),
    discard: () =>
      run("Eliminando borrador…", async () => {
        await writes.current.catch(() => {});
        await repository.clearDraft();
        draftRef.current = { name: "", pages: [] };
        setDraft(draftRef.current);
        return true;
      }),
    pick: () =>
      run("Abriendo PDF…", async () => {
        const item = await documentUseCases.pickPdf();
        await reload();
        return item;
      }),
    importPdf: (uri: string, name: string) =>
      run("Guardando PDF recibido…", async () => {
        const item = await documentUseCases.importPdf(uri, name);
        await reload();
        return item;
      }),
    share: (id: string) =>
      run("Preparando archivo…", () => documentUseCases.share(id)),
    rename: (id: string, name: string) =>
      run("Guardando nombre…", async () => {
        await documentUseCases.rename(id, name);
        await reload();
        return true;
      }),
    remove: (id: string) =>
      run("Eliminando documento…", async () => {
        await repository.remove(id);
        await reload();
        return true;
      }),
    setPageCount: async (id: string, count: number) => {
      try {
        await repository.setPageCount(id, count);
        await reload();
      } catch {
        setError("No se pudo actualizar la cantidad de páginas.");
      }
    },
  };
}
const DocumentsContext = createContext<ReturnType<
  typeof useDocumentsState
> | null>(null);
export function DocumentsProvider({ children }: { children: ReactNode }) {
  return (
    <DocumentsContext.Provider value={useDocumentsState()}>
      {children}
    </DocumentsContext.Provider>
  );
}
export function useDocuments() {
  const context = useContext(DocumentsContext);
  if (!context) throw new Error("DocumentsProvider no está disponible.");
  return context;
}
