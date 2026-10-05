import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDocuments } from "../DocumentsProvider";
import { Feedback } from "../components/Feedback";
import { ActionButton } from "@/shared/ui/ActionButton";
import { colors } from "@/shared/ui/theme";
export default function EditorScreen() {
  const model = useDocuments();
  const disabled = !!model.busy || !model.ready;
  async function save() {
    const document = await model.save();
    if (document)
      router.replace({
        pathname: "/document/[id]",
        params: { id: document.id },
      });
  }
  function discard() {
    Alert.alert(
      "¿Descartar estas hojas?",
      "Se eliminará el borrador. Los PDF guardados se conservarán.",
      [
        { text: "Conservar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            if (await model.discard()) router.replace("/documents");
          },
        },
      ],
    );
  }
  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Tu nuevo documento</Text>
        <Text style={styles.subtitle}>Revisa las hojas y ponle un nombre.</Text>
        <Feedback />
        <Text style={styles.label}>Nombre del documento</Text>
        <TextInput
          accessibilityLabel="Nombre del documento"
          value={model.draft.name}
          onChangeText={model.setName}
          editable={!disabled}
          maxLength={80}
          placeholder="Ej. Exámenes médicos"
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="done"
        />
        <Text style={styles.label}>
          {model.draft.pages.length}{" "}
          {model.draft.pages.length === 1
            ? "hoja escaneada"
            : "hojas escaneadas"}
        </Text>
        {model.draft.pages.map((page, index) => (
          <View key={page.id} style={styles.page}>
            <Image
              source={{ uri: page.uri }}
              style={styles.image}
              resizeMode="contain"
            />
            <View style={styles.pageInfo}>
              <Text style={styles.pageTitle}>Hoja {index + 1}</Text>
              <View style={styles.controls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mover hoja ${index + 1} hacia arriba`}
                  disabled={disabled || index === 0}
                  onPress={() => model.reorder(index, -1)}
                  style={[
                    styles.control,
                    (index === 0 || disabled) && styles.disabled,
                  ]}
                >
                  <Ionicons name="arrow-up" size={24} color={colors.primary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mover hoja ${index + 1} hacia abajo`}
                  disabled={disabled || index === model.draft.pages.length - 1}
                  onPress={() => model.reorder(index, 1)}
                  style={[
                    styles.control,
                    (index === model.draft.pages.length - 1 || disabled) &&
                      styles.disabled,
                  ]}
                >
                  <Ionicons
                    name="arrow-down"
                    size={24}
                    color={colors.primary}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar hoja ${index + 1}`}
                  disabled={disabled}
                  onPress={() =>
                    Alert.alert(
                      "¿Eliminar esta hoja?",
                      `Se quitará la hoja ${index + 1} del documento.`,
                      [
                        { text: "Conservar", style: "cancel" },
                        {
                          text: "Eliminar",
                          style: "destructive",
                          onPress: () => model.removePage(page.id),
                        },
                      ],
                    )
                  }
                  style={styles.control}
                >
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
        {!model.draft.pages.length && (
          <Text style={styles.empty}>Agrega una hoja para empezar.</Text>
        )}
        <ActionButton
          title="Agregar más hojas"
          icon="scan-outline"
          secondary
          disabled={disabled}
          onPress={() => {
            void model.scan();
          }}
        />
        <Text style={styles.tip}>
          Puedes ajustar el recorte y los filtros dentro del escáner antes de
          aceptar las hojas.
        </Text>
        {model.draft.pages.length > 0 && (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            onPress={discard}
            style={styles.discard}
          >
            <Text style={styles.discardText}>Descartar borrador</Text>
          </Pressable>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <ActionButton
          title="Guardar PDF"
          icon="checkmark-circle-outline"
          onPress={save}
          disabled={
            disabled || !model.draft.pages.length || !model.draft.name.trim()
          }
          loading={model.busy === "Creando tu PDF…"}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, maxWidth: 650, width: "100%", alignSelf: "center" },
  title: { fontSize: 27, fontWeight: "800", color: colors.ink },
  subtitle: {
    color: colors.muted,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 8,
    marginBottom: 22,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 10,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    minHeight: 60,
    padding: 16,
    fontSize: 19,
    color: colors.ink,
    backgroundColor: "white",
  },
  page: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: 84,
    height: 112,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  pageInfo: { flex: 1 },
  pageTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.ink,
    marginBottom: 12,
  },
  controls: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  control: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.25 },
  tip: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 15 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: "white",
  },
  discard: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  discardText: { color: colors.danger, fontSize: 17, fontWeight: "600" },
  empty: {
    fontSize: 17,
    color: colors.muted,
    marginVertical: 25,
    textAlign: "center",
  },
});
