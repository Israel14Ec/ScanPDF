export interface ScannedPage {
  id: string;
  uri: string;
  width: number;
  height: number;
}

export interface DocumentScanner {
  scan(): Promise<ScannedPage[] | null>;
}
