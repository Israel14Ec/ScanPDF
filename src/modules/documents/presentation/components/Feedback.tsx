import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "@/shared/ui/theme";
import { useDocuments } from "../DocumentsProvider";
export function Feedback() {
  const { error, clearError, busy } = useDocuments();
  return (
    <>
      {error && (
        <View accessibilityRole="alert" style={styles.error}>
          <Text style={styles.text}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={clearError}
            style={styles.dismiss}
          >
            <Text style={styles.link}>Cerrar aviso</Text>
          </Pressable>
        </View>
      )}
      {busy && (
        <View accessibilityLiveRegion="polite" style={styles.busy}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.busyText}>{busy}</Text>
        </View>
      )}
    </>
  );
}
const styles = StyleSheet.create({
  error: {
    backgroundColor: "#FFF0F1",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  text: { color: colors.danger, fontSize: 16, lineHeight: 24 },
  dismiss: { paddingVertical: 10 },
  link: { color: colors.danger, fontSize: 16, fontWeight: "700" },
  busy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: colors.paleBlue,
    borderRadius: 14,
    marginBottom: 12,
  },
  busyText: { color: colors.ink, fontSize: 16, flexShrink: 1 },
});
