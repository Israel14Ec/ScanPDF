import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import type { ComponentProps } from "react";
import { colors } from "./theme";

export function ActionButton({
  title,
  icon,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
}: {
  title: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.primary : "white"} />
      ) : (
        icon && (
          <Ionicons
            name={icon}
            size={23}
            color={secondary ? colors.primary : "white"}
          />
        )
      )}
      <Text style={[styles.text, secondary && { color: colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondary: { backgroundColor: colors.paleBlue },
  text: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    flexShrink: 1,
    textAlign: "center",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
