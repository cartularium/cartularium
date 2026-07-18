export async function contentAddressedName(
  originalName: string,
  data: ArrayBuffer,
): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data)
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const prefix = hex.slice(0, 12)
  const base = originalName.split("/").pop() ?? "file"
  const safe = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
  return `${prefix}/${safe}`
}
