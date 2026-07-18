export function pathToBranchSlug(path: string): string {
  // Defense-in-depth: the route validates path before reaching here, but a
  // future caller that skips that check shouldn't be able to pollute the
  // fork's branch namespace by passing "../etc/passwd" (which would
  // otherwise normalize to "etc-passwd").
  if (
    path.startsWith("/") ||
    path.split("/").some((s) => s === "" || s === "." || s === "..")
  ) {
    throw new Error("unsafe_path")
  }
  return path
    .toLowerCase()
    .replace(/[^a-z0-9-/.]+/g, "-")
    .replace(/[/.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}
