import { useLocalSearchParams, router, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDocuments } from "../DocumentsProvider";
import { PdfView } from "../components/PdfView";
import { Feedback } from "../components/Feedback";
import { ActionButton } from "@/shared/ui/ActionButton";
import { colors } from "@/shared/ui/theme";
export default function ViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const model = useDocuments();
  const document = model.documents.find((item) => item.id === id);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [failure, setFailure] = useState("");
  const [passwordNeeded, setPasswordNeeded] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [password, setPassword] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  if (!document)
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.message}>
          <Text style={styles.title}>
            {model.ready ? "Documento no disponible" : "Abriendo documento…"}
          </Text>
          <ActionButton
            title="Volver al inicio"
            onPress={() => router.replace("/documents")}
          />
        </View>
      </SafeAreaView>
    );
  function remove() {
    Alert.alert(
      "¿Eliminar este documento?",
      "Se eliminará la copia guardada en Mi Escáner PDF.",
      [
        { text: "Conservar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (await model.remove(id)) router.replace("/documents");
          },
        },
      ],
    );
  }
  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <Stack.Screen options={{ title: document.name }} />
      <View style={styles.toolbar}>
        <Text numberOfLines={2} style={styles.title}>
          {document.name}
        </Text>
        <Text style={styles.meta}>
          {count ? `Página ${page} de ${count}` : "Cargando páginas…"}
        </Text>
      </View>
      <View style={styles.feedback}>
        <Feedback />
      </View>
      {failure ? (
        <View style={styles.message}>
          <Text accessibilityRole="alert" style={styles.error}>
            {failure}
          </Text>
          {passwordNeeded && (
            <TextInput
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Contraseña del PDF"
              accessibilityLabel="Contraseña del PDF"
              style={styles.input}
            />
          )}
          <ActionButton
            title={
              passwordNeeded ? "Abrir con contraseña" : "Volver a intentar"
            }
            onPress={() => {
              setPassword(passwordInput);
              setFailure("");
              setAttempt(attempt + 1);
            }}
          />
        </View>
      ) : (
        <PdfView
          key={`${id}-${attempt}`}
          uri={document.pdfUri}
          password={password}
          onLoad={(total) => {
            setCount(total);
            if (document.pageCount !== total)
              void model.setPageCount(id, total);
          }}
          onPage={(current, total) => {
            setPage(current);
            setCount(total);
          }}
          onError={(error) => {
            const protectedPdf = /password|contrase|encrypted/i.test(
              error.message,
            );
            setPasswordNeeded(protectedPdf);
            setFailure(
              protectedPdf
                ? "Este PDF necesita una contraseña."
                : "No pudimos abrir este PDF. Puede estar dañado o no ser compatible.",
            );
          }}
        />
      )}
      {!failure && (
        <Text style={styles.hint}>
          Desliza para leer · Usa dos dedos para ampliar
        </Text>
      )}
      <View style={styles.footer}>
        <ActionButton
          title="Compartir PDF"
          icon="share-social-outline"
          disabled={!!model.busy}
          onPress={() => {
            void model.share(id);
          }}
        />
        <View style={styles.actions}>
          <Pressable
            disabled={!!model.busy}
            accessibilityRole="button"
            onPress={() => {
              setName(document.name);
              setRenaming(true);
            }}
            style={styles.smallAction}
          >
            <Text style={styles.actionText}>Cambiar nombre</Text>
          </Pressable>
          <Pressable
            disabled={!!model.busy}
            accessibilityRole="button"
            onPress={remove}
            style={styles.smallAction}
          >
            <Text style={[styles.actionText, { color: colors.danger }]}>
              Eliminar
            </Text>
          </Pressable>
        </View>
      </View>
      <Modal
        visible={renaming}
        transparent
        animationType="fade"
        onRequestClose={() => setRenaming(false)}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Cambiar nombre</Text>
            <TextInput
              accessibilityLabel="Nuevo nombre"
              autoFocus
              value={name}
              onChangeText={setName}
              editable={!model.busy}
              maxLength={80}
              style={styles.input}
            />
            <Feedback />
            <ActionButton
              title="Guardar nombre"
              disabled={!!model.busy || !name.trim()}
              onPress={async () => {
                if (await model.rename(id, name)) setRenaming(false);
              }}
            />
            <ActionButton
              title="Cancelar"
              secondary
              disabled={!!model.busy}
              onPress={() => setRenaming(false)}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.ink, fontSize: 21, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 15, marginTop: 5 },
  feedback: { paddingHorizontal: 16 },
  hint: { fontSize: 13, color: colors.muted, textAlign: "center", padding: 10 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "white" },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  smallAction: {
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  actionText: { color: colors.primary, fontSize: 16, fontWeight: "600" },
  message: { flex: 1, padding: 24, justifyContent: "center", gap: 18 },
  error: {
    color: colors.danger,
    fontSize: 18,
    lineHeight: 27,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: 58,
    borderRadius: 14,
    fontSize: 18,
    color: colors.ink,
    backgroundColor: "white",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#15254488",
    justifyContent: "center",
    padding: 24,
  },
  dialog: { backgroundColor: "white", padding: 22, borderRadius: 24, gap: 18 },
});
