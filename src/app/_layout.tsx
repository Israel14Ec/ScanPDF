import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DocumentsProvider } from "@/modules/documents/presentation/DocumentsProvider";
import { colors } from "@/shared/ui/theme";
export default function RootLayout() {
  return (
    <DocumentsProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { fontSize: 19, fontWeight: "700" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="editor" options={{ title: "Escanear documento" }} />
        <Stack.Screen
          name="document/[id]"
          options={{ title: "Mi documento" }}
        />
        <Stack.Screen name="incoming" options={{ title: "Abrir PDF" }} />
      </Stack>
    </DocumentsProvider>
  );
}
