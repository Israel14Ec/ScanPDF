import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDocuments } from "@/modules/documents/presentation/DocumentsProvider";
import { Feedback } from "@/modules/documents/presentation/components/Feedback";
import { ActionButton } from "@/shared/ui/ActionButton";
import { TabPage } from "@/shared/ui/TabPage";
import { colors } from "@/shared/ui/theme";

export default function ScannerScreen() {
  const model = useDocuments();
  const disabled = !model.ready || !!model.busy;
  async function startScan() {
    if (model.draft.pages.length || (await model.scan()))
      router.push("/editor");
  }
  return (
    <TabPage title="Escanear" subtitle="Convierte tus hojas en un PDF.">
      <View style={styles.hero}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear documento"
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={startScan}
          style={({ pressed }) => [
            styles.scan,
            pressed && { opacity: 0.85 },
            disabled && { opacity: 0.5 },
          ]}
        >
          <Ionicons name="scan-outline" size={78} color="white" />
          <Text style={styles.label}>Escanear{"\n"}documento</Text>
        </Pressable>
        <Text style={styles.hint}>
          Apunta a una hoja. La cámara detecta sus bordes.
        </Text>
        <Text style={styles.details}>
          Puedes agregar varias hojas y guardar todo con un nombre.
        </Text>
      </View>
      <Feedback />
      {model.draft.pages.length > 0 && (
        <View style={styles.draft}>
          <Text style={styles.draftTitle}>Tu documento está pendiente</Text>
          <Text style={styles.details}>
            {model.draft.pages.length} hojas en el borrador
          </Text>
          <ActionButton
            title="Continuar documento"
            icon="arrow-forward-outline"
            onPress={() => router.push("/editor")}
            disabled={disabled}
            secondary
          />
        </View>
      )}
    </TabPage>
  );
}
const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
    gap: 18,
  },
  scan: {
    width: 210,
    minHeight: 210,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 6,
  },
  label: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "white",
  },
  hint: {
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
    textAlign: "center",
    maxWidth: 300,
  },
  details: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 320,
  },
  draft: {
    padding: 18,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    gap: 12,
  },
  draftTitle: { fontSize: 19, fontWeight: "700", color: colors.ink },
});
