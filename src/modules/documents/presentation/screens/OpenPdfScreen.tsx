import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useDocuments } from "../DocumentsProvider";
import { Feedback } from "../components/Feedback";
import { ActionButton } from "@/shared/ui/ActionButton";
import { TabPage } from "@/shared/ui/TabPage";
import { colors } from "@/shared/ui/theme";

export default function OpenPdfScreen() {
  const model = useDocuments();
  async function openPdf() {
    const document = await model.pick();
    if (document)
      router.push({ pathname: "/document/[id]", params: { id: document.id } });
  }
  return (
    <TabPage title="Abrir PDF" subtitle="Lee y comparte un PDF de tu teléfono.">
      <View style={styles.hero}>
        <View style={styles.icon}>
          <Ionicons
            name="document-text-outline"
            size={88}
            color={colors.primary}
          />
        </View>
        <Text style={styles.title}>Tus PDF, fáciles de leer</Text>
        <Text style={styles.description}>
          Abre un archivo, amplía sus páginas y compártelo por WhatsApp.
        </Text>
        <View style={styles.action}>
          <ActionButton
            title="Elegir un PDF"
            icon="folder-open-outline"
            onPress={openPdf}
            disabled={!model.ready || !!model.busy}
          />
        </View>
        <Text style={styles.hint}>
          El archivo también aparecerá en Mis documentos.
        </Text>
      </View>
      <Feedback />
    </TabPage>
  );
}
const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 28,
    gap: 20,
  },
  icon: {
    width: 170,
    height: 170,
    borderRadius: 42,
    backgroundColor: colors.paleBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 300,
  },
  action: { width: "100%", maxWidth: 340 },
  hint: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    color: colors.muted,
    maxWidth: 300,
  },
});
