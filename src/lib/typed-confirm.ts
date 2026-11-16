/**
 * The typed-name check behind every delete dialog. Case and surrounding spaces
 * are ignored so a phone keyboard's auto-capitalisation doesn't block anyone,
 * but the whole name still has to be typed.
 */
export function typedTextMatches(typed: string, expected: string): boolean {
  const wanted = expected.trim().toLowerCase();
  return wanted.length > 0 && typed.trim().toLowerCase() === wanted;
}
