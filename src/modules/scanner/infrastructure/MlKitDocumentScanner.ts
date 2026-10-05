import { Platform } from "react-native";
import { launchScanner } from "@dariyd/react-native-document-scanner";
import type { DocumentScanner } from "../domain/DocumentScanner";

export class MlKitDocumentScanner implements DocumentScanner {
  async scan() {
    if (Platform.OS !== "android")
      throw new Error("El escáner está disponible en Android.");
    try {
      const result = await launchScanner({
        scannerMode: "full",
        galleryImportAllowed: true,
        pageLimit: 100,
        quality: 0.9,
        maxWidth: 2200,
        maxHeight: 2200,
        includeBase64: false,
        includePdf: false,
      });
      if (result.didCancel) return null;
      if (result.error)
        throw new Error(result.errorMessage || "No se pudo abrir el escáner.");
      if (!result.images?.length) return null;
      return result.images.map((image, index) => ({
        id: `page-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        uri: image.uri,
        width: image.width,
        height: image.height,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String((error as { errorMessage?: string })?.errorMessage || "");
      if (/not available|could not be found/i.test(message)) {
        throw new Error(
          "Esta instalación no incluye el escáner. Instala la versión Android de Mi Escáner PDF.",
        );
      }
      throw new Error(
        "No se pudo iniciar el escáner. Comprueba tu conexión la primera vez y que Servicios de Google Play esté actualizado. Inténtalo de nuevo.",
      );
    }
  }
}
