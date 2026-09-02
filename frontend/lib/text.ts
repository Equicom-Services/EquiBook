/*
 * Employees and admins type free-text fields however they like, so the
 * admin dashboard uppercases the first letter to keep the cards uniform.
 *
 * Only the first character is touched — the rest is left as typed, so
 * acronyms and proper nouns ("SM Southmall", "IT audit") survive.
 */
export function capitalizeFirst(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
