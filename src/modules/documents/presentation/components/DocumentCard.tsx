import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Document } from "../../domain/Document";
import { colors } from "@/shared/ui/theme";
export function DocumentCard({
  document,
  onPress,
  onShare,
  disabled,
}: {
  document: Document;
  onPress: () => void;
  onShare: () => void;
  disabled: boolean;
}) {
  const date = new Date(document.createdAt).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
  const size =
    document.size < 1024 * 1024
      ? `${Math.max(1, Math.round(document.size / 1024))} KB`
      : `${(document.size / 1024 / 1024).toFixed(1)} MB`;
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${document.name}`}
        style={styles.content}
      >
        <View style={styles.preview}>
          {document.thumbnailUri ? (
            <Image
              source={{ uri: document.thumbnailUri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <Ionicons
              name="document-text-outline"
              size={32}
              color={colors.primary}
            />
          )}
        </View>
        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.name}>
            {document.name}
          </Text>
          <Text style={styles.meta}>
            {document.pageCount === null
              ? "PDF importado"
              : `${document.pageCount} ${document.pageCount === 1 ? "página" : "páginas"}`}{" "}
            · {size}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onShare}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Compartir ${document.name}`}
        style={styles.share}
      >
        <Ionicons
          name="share-social-outline"
          size={25}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
    gap: 13,
    minHeight: 106,
  },
  preview: {
    width: 58,
    height: 76,
    borderRadius: 10,
    backgroundColor: colors.paleBlue,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  details: { flex: 1, gap: 5 },
  name: { fontSize: 18, fontWeight: "700", color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  date: { fontSize: 13, color: colors.muted },
  share: {
    minWidth: 52,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
