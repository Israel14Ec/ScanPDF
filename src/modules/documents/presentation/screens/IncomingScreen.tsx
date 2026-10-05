import { useIncomingShare } from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useDocuments } from "../DocumentsProvider";
import { Feedback } from "../components/Feedback";
import { ActionButton } from "@/shared/ui/ActionButton";
import { colors } from "@/shared/ui/theme";
export default function IncomingScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { resolvedSharedPayloads, isResolving, clearSharedPayloads, error } =
    useIncomingShare();
  const model = useDocuments();
  const started = useRef(false);
  const [finished, setFinished] = useState(false);
  const candidate = resolvedSharedPayloads.find(
    (item) =>
      item.contentMimeType === "application/pdf" ||
      item.originalName?.toLowerCase().endsWith(".pdf"),
  );
  const sourceUri = uri || candidate?.contentUri;
  const filename = candidate?.originalName || "PDF recibido";
  useEffect(() => {
    if (!model.ready || model.busy || started.current || !sourceUri) return;
    started.current = true;
    void model.importPdf(sourceUri, filename).then((document) => {
      setFinished(true);
      if (document) {
        clearSharedPayloads();
        router.replace({
          pathname: "/document/[id]",
          params: { id: document.id },
        });
      }
    });
  }, [sourceUri, filename, model, clearSharedPayloads]);
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Abrir PDF recibido</Text>
      <Feedback />
      {!finished && sourceUri && (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      {isResolving && <Text style={styles.text}>Leyendo el archivo…</Text>}
      {!isResolving && !sourceUri && (
        <Text style={styles.text}>
          {error
            ? "No se pudo recibir el archivo."
            : "Comparte un archivo PDF con Mi Escáner PDF o selecciónalo desde el inicio."}
        </Text>
      )}
      <ActionButton
        title="Volver al inicio"
        secondary
        disabled={!!model.busy}
        onPress={() => {
          clearSharedPayloads();
          router.replace("/pdf");
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 20,
    backgroundColor: colors.background,
  },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink },
  text: { fontSize: 18, color: colors.muted, lineHeight: 27 },
});
