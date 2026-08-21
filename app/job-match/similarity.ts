import { normalizeText } from "./normalization";

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
