/** Isomorphic word counter shared by the client-side counter UI and server-side Zod validation. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}
