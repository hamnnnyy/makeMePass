export function sample<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('Cannot sample from empty array');
  return arr[Math.floor(Math.random() * arr.length)];
}

export function sampleN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}
