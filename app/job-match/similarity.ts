import { normalizeText, tokenize } from "./normalization";

export function levenshteinDistance(leftValue: string, rightValue: string): number {
  const left = normalizeText(leftValue);
  const right = normalizeText(rightValue);
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(current[rightIndex - 1] + 1, previous[rightIndex] + 1, substitution);
    }
    previous = current;
  }
  return previous[right.length];
}

/** Conservative spelling comparison. It is not a semantic similarity function. */
export function isApproximateSpellingMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (normalizedLeft.includes(" ") || normalizedRight.includes(" ")) return false;
  const longest = Math.max(normalizedLeft.length, normalizedRight.length);
  if (longest < 5 || Math.abs(normalizedLeft.length - normalizedRight.length) > 1) return false;
  return levenshteinDistance(normalizedLeft, normalizedRight) === 1;
}

/**
 * Finds a phrase inside a longer text while tolerating one conservative spelling
 * difference. Requiring every other token to be exact keeps phrases such as
 * `componentes reutillizables` useful without turning this into semantic matching.
 */
export function findApproximatePhraseOccurrence(text: string, phrase: string): string | null {
  const haystack = tokenize(text);
  const needle = tokenize(phrase);
  if (!needle.length || needle.length > haystack.length) return null;

  for (let index = 0; index <= haystack.length - needle.length; index += 1) {
    const window = haystack.slice(index, index + needle.length);
    let approximateDifferences = 0;
    const matches = needle.every((token, offset) => {
      if (token === window[offset]) return true;
      if (approximateDifferences > 0 || !isApproximateSpellingMatch(token, window[offset])) return false;
      approximateDifferences += 1;
      return true;
    });
    if (matches && approximateDifferences === 1) return window.join(" ");
  }
  return null;
}
