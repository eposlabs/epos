export function slugify(text: string) {
  return text
    .toString() // Ensure it's a string
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from both ends
    .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters (except spaces and dashes)
    .replace(/[\s-]+/g, '-') // Replace spaces and multiple dashes with a single dash
    .replace(/^-+|-+$/g, '') // Remove leading and trailing dashes
}
