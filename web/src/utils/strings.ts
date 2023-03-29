export function truncateHash(hash?: string): string {
  if (!hash) return '';
  if (hash.length <= 10) return hash;
  return hash.substring(0, 6) + '...' + hash.substring(hash.length - 4, hash.length);
}
