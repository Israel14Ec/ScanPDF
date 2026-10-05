import type { DocumentScanner } from "../domain/DocumentScanner";

export class ScanPages {
  constructor(private readonly scanner: DocumentScanner) {}
  execute() {
    return this.scanner.scan();
  }
}
