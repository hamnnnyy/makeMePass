'use client';

const cache = new Map<string, string>();

export function getCachedAudio(key: string): string | undefined {
  return cache.get(key);
}

export function setCachedAudio(key: string, dataUrl: string): void {
  if (cache.size >= 50) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, dataUrl);
}
