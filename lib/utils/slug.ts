export function slugify(input: unknown): string {
  const text =
    typeof input === "string"
      ? input
      : Array.isArray(input)
        ? input.map((c) => (typeof c === "string" ? c : "")).join("")
        : "";

  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
