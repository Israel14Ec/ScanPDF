import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDocuments } from "../DocumentsProvider";
import { DocumentCard } from "../components/DocumentCard";
import { Feedback } from "../components/Feedback";
import { colors } from "@/shared/ui/theme";

export default function HomeScreen() {
  const model = useDocuments();
  const [query, setQuery] = useState("");
  const disabled = !model.ready || !!model.busy;
  const visible = model.documents.filter((document) =>
    document.name
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase().trim()),
  );
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <FlatList
        data={visible}
        keyExtractor={(document) => document.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Text style={styles.brand}>Mi Escáner PDF</Text>
            <View style={styles.heading}>
              <Text style={styles.title}>Mis documentos</Text>
              <Text style={styles.count}>{model.documents.length}</Text>
            </View>
            <Text style={styles.subtitle}>
              Tus escaneos y PDF guardados, en un solo lugar.
            </Text>
            <View style={styles.search}>
              <Ionicons name="search-outline" size={22} color={colors.muted} />
              <TextInput
                accessibilityLabel="Buscar documento por nombre"
                placeholder="Buscar por nombre"
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                style={styles.input}
              />
            </View>
            <Feedback />
          </>
        }
        renderItem={({ item }) => (
          <DocumentCard
            document={item}
            disabled={disabled}
            onPress={() =>
              router.push({
                pathname: "/document/[id]",
                params: { id: item.id },
              })
            }
            onShare={() => {
              void model.share(item.id);
            }}
          />
        )}
        ListEmptyComponent={
          !model.ready && !model.error ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="documents-outline"
                size={52}
                color={colors.muted}
              />
              <Text style={styles.emptyTitle}>
                {query
                  ? "No encontramos ese nombre"
                  : "Aquí estarán tus documentos"}
              </Text>
              <Text style={styles.emptyText}>
                {query
                  ? "Prueba con otra palabra."
                  : "Usa Escanear para crear un documento o PDF para abrir un archivo."}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          <Text style={styles.footer}>Guardados en este teléfono</Text>
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: 22,
    paddingBottom: 28,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 12,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, flexShrink: 1 },
  count: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.paleBlue,
    fontSize: 16,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    marginTop: 8,
    marginBottom: 24,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  input: { flex: 1, minHeight: 54, fontSize: 17, color: colors.ink },
  empty: {
    padding: 30,
    gap: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: colors.ink,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    color: colors.muted,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: colors.muted,
    marginTop: 24,
  },
});
