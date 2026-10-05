import { ScanPages } from "@/modules/scanner/application/ScanPages";
import { MlKitDocumentScanner } from "@/modules/scanner/infrastructure/MlKitDocumentScanner";
import { DocumentUseCases } from "@/modules/documents/application/DocumentUseCases";
import { LocalDocumentRepository } from "@/modules/documents/infrastructure/LocalDocumentRepository";
import { ExpoPdfGenerator } from "@/modules/documents/infrastructure/ExpoPdfGenerator";
import { ExpoPdfPicker } from "@/modules/documents/infrastructure/ExpoPdfPicker";
import { ExpoFileSharer } from "@/modules/documents/infrastructure/ExpoFileSharer";

export const repository = new LocalDocumentRepository();
export const scanPages = new ScanPages(new MlKitDocumentScanner());
export const documentUseCases = new DocumentUseCases(
  repository,
  new ExpoPdfGenerator(),
  new ExpoPdfPicker(),
  new ExpoFileSharer(),
);
