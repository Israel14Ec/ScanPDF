import { Text, View } from "react-native";
export function PdfView(_props: {
  uri: string;
  password: string;
  onLoad: (count: number) => void;
  onPage: (page: number, count: number) => void;
  onError: (error: Error) => void;
}) {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, textAlign: "center" }}>
        Abre la aplicación Android para leer este PDF.
      </Text>
    </View>
  );
}
