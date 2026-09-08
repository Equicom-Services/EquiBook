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

/*
 * Title-case a free-text field: uppercase the first letter of every
 * word, leave the rest of each word as typed.
 *
 * Used for the request cards' heading and Purpose, where "employee
 * transport" and "Employee Transport" would otherwise sit side by side.
 * The rest of each word is untouched on purpose, for the same reason
 * capitalizeFirst leaves it alone — "SM Southmall" and "NAIA Terminal 3"
 * survive intact.
 */
export function titleCase(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  return value.replace(
    /(^|\s)(\S)/g,
    (_, lead: string, char: string) =>
      lead + char.toUpperCase()
  );
}
