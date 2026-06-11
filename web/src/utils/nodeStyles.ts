/* Status visual recipe shared by graph nodes, hover cards and the legend:
 * dim status-tinted core, bright status rim (the progress arc) and a soft
 * glow so state reads at any zoom level. Single source of truth — the
 * legend renders straight from this table, so it cannot drift from the
 * nodes. */

export type NodeStyleKey =
  | 'canonical'
  | 'fork'
  | 'finalized'
  | 'justified'
  | 'invalid'
  | 'optimistic';

export interface NodeStyle {
  fill: string;
  arc: string;
  track: string;
  label: string;
  glow: string;
  cardGlow: string;
}

export const NODE_STYLES: Record<NodeStyleKey, NodeStyle> = {
  canonical: {
    fill: 'bg-canonical-deep',
    arc: 'text-canonical-ring',
    track: 'text-canonical-edge',
    label: 'text-canonical',
    glow: 'shadow-[0_0_90px_-15px_var(--color-canonical-ring)]',
    cardGlow: 'shadow-[0_0_44px_-10px_var(--color-canonical-ring)]',
  },
  fork: {
    fill: 'bg-fork-deep',
    arc: 'text-fork-ring',
    track: 'text-fork-edge',
    label: 'text-fork',
    glow: 'shadow-[0_0_90px_-15px_var(--color-fork-ring)]',
    cardGlow: 'shadow-[0_0_44px_-10px_var(--color-fork-ring)]',
  },
  finalized: {
    fill: 'bg-finalized-deep',
    arc: 'text-finalized-ring',
    track: 'text-finalized-edge',
    label: 'text-finalized',
    glow: 'shadow-[0_0_90px_-15px_var(--color-finalized-ring)]',
    cardGlow: 'shadow-[0_0_44px_-10px_var(--color-finalized-ring)]',
  },
  justified: {
    fill: 'bg-justified-deep',
    arc: 'text-justified-ring',
    track: 'text-justified-edge',
    label: 'text-justified',
    glow: 'shadow-[0_0_90px_-15px_var(--color-justified-ring)]',
    cardGlow: 'shadow-[0_0_44px_-10px_var(--color-justified-ring)]',
  },
  invalid: {
    fill: 'bg-invalid-deep',
    arc: 'text-invalid-ring',
    track: 'text-invalid-edge',
    label: 'text-invalid',
    glow: 'shadow-[0_0_90px_-15px_var(--color-invalid-ring)]',
    cardGlow: 'shadow-[0_0_44px_-10px_var(--color-invalid-ring)]',
  },
  optimistic: {
    fill: 'bg-optimistic-deep',
    arc: 'text-optimistic-ring',
    track: 'text-optimistic-edge',
    label: 'text-optimistic',
    glow: 'shadow-[0_0_90px_-15px_var(--color-optimistic-ring)]',
    cardGlow: 'shadow-[0_0_44px_-10px_var(--color-optimistic-ring)]',
  },
};
