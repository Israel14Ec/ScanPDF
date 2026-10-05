import Pdf from "react-native-pdf";
import { ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/shared/ui/theme";
export function PdfView({
  uri,
  password,
  onLoad,
  onPage,
  onError,
}: {
  uri: string;
  password: string;
  onLoad: (count: number) => void;
  onPage: (page: number, count: number) => void;
  onError: (error: Error) => void;
}) {
  return (
    <Pdf
      source={{ uri, cache: false }}
      password={password}
      style={styles.pdf}
      minScale={1}
      maxScale={5}
      fitPolicy={0}
      spacing={14}
      enableDoubleTapZoom
      trustAllCerts={false}
      renderActivityIndicator={() => (
        <ActivityIndicator size="large" color={colors.primary} />
      )}
      onLoadComplete={onLoad}
      onPageChanged={onPage}
      onError={onError}
    />
  );
}
const styles = StyleSheet.create({
  pdf: { flex: 1, backgroundColor: "#E5EAF2", width: "100%" },
});
