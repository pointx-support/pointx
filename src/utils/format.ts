/**
 * Returns the ordinal representation of a positive integer (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const num = Math.max(1, Math.floor(n));
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Returns the contextual Matchpoint action label, e.g. "Calculate 1st Matchpoint"
 */
export function getMatchpointLabel(n: number): string {
  return `Calculate ${getOrdinalSuffix(n)} Matchpoint`;
}
