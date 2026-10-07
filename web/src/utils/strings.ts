export function truncateHash(hash?: string): string {
  if (!hash) return '';
  if (hash.length <= 10) return hash;
  return hash.substring(0, 6) + '...' + hash.substring(hash.length - 4, hash.length);
}

export function convertToHexColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= hash; // Use a bitwise OR to simplify the code
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 255;
    color += value.toString(16).padStart(2, '0'); // Use padStart to ensure 2 characters
  }
  return color;
}

// Formats a client-specific extra_data value for display. Checkpoints render
// as "epoch · root"; other objects as JSON.
export function formatExtraDataValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value !== 'object') return `${value}`;
  if ('epoch' in value && 'root' in value) return `${value.epoch} · ${value.root}`;
  return JSON.stringify(value);
}
