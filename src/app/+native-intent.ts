export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (/^(content|file):\/\//i.test(path))
      return `/incoming?uri=${encodeURIComponent(path)}`;
    if (new URL(path).hostname === "expo-sharing") return "/incoming";
    return path;
  } catch {
    return "/";
  }
}
