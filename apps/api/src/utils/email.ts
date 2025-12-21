/**
 * Normalize email address to lowercase and trim whitespace
 * This prevents duplicate accounts with different email casing
 * @param email - The email address to normalize
 * @returns The normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
