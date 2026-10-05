import { getDocumentAsync } from "expo-document-picker";
import type { PdfPicker } from "../domain/ports";

export class ExpoPdfPicker implements PdfPicker {
  async pick() {
    const result = await getDocumentAsync({
      type: "application/pdf",
      multiple: false,
      copyToCacheDirectory: true,
    });
    return result.canceled
      ? null
      : { uri: result.assets[0].uri, name: result.assets[0].name };
  }
}
