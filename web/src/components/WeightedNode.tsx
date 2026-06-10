import { memo } from 'react';

import classNames from 'clsx';

import ProgressCircle from '@components/ProgressCircle';

/* Status visual recipe: dim status-tinted core, bright status rim (the
 * progress arc) and a soft glow so state reads at any zoom level. */
const NODE_STYLES: Record<
  string,
  { fill: string; arc: string; track: string; label: string; glow: string }
> = {
  canonical: {
    fill: 'bg-canonical-deep',
    arc: 'text-canonical-ring',
    track: 'text-canonical-edge',
    label: 'text-canonical',
    glow: 'shadow-[0_0_90px_-15px_var(--color-canonical-ring)]',
  },
  fork: {
    fill: 'bg-fork-deep',
    arc: 'text-fork-ring',
    track: 'text-fork-edge',
    label: 'text-fork',
    glow: 'shadow-[0_0_90px_-15px_var(--color-fork-ring)]',
  },
  finalized: {
    fill: 'bg-finalized-deep',
    arc: 'text-finalized-ring',
    track: 'text-finalized-edge',
    label: 'text-finalized',
    glow: 'shadow-[0_0_90px_-15px_var(--color-finalized-ring)]',
  },
  justified: {
    fill: 'bg-justified-deep',
    arc: 'text-justified-ring',
    track: 'text-justified-edge',
    label: 'text-justified',
    glow: 'shadow-[0_0_90px_-15px_var(--color-justified-ring)]',
  },
  invalid: {
    fill: 'bg-invalid-deep',
    arc: 'text-invalid-ring',
    track: 'text-invalid-edge',
    label: 'text-invalid',
    glow: 'shadow-[0_0_90px_-15px_var(--color-invalid-ring)]',
  },
  optimistic: {
    fill: 'bg-optimistic-deep',
    arc: 'text-optimistic-ring',
    track: 'text-optimistic-edge',
    label: 'text-optimistic',
    glow: 'shadow-[0_0_90px_-15px_var(--color-optimistic-ring)]',
  },
};

function WeightedNode({
  id,
  hash,
  weight,
  type,
  validity,
  x,
  y,
  radius,
  weightPercentageComparedToHeaviestNeighbor = 100,
  className,
  onClick,
}: {
  id?: string;
  hash: string;
  weight: string;
  type: 'canonical' | 'fork' | 'finalized' | 'justified' | 'detached';
  validity: 'valid' | string;
  x: number;
  y: number;
  radius: number;
  weightPercentageComparedToHeaviestNeighbor?: number;
  className?: string;
  onClick?: (hash: string) => void;
}) {
  const styleKey = (() => {
    if (!['valid', 'optimistic'].includes(validity.toLowerCase())) return 'invalid';
    if (type === 'detached') return 'invalid';
    if (type === 'canonical' && validity.toLowerCase() === 'optimistic') return 'optimistic';
    return type;
  })();
  const styles = NODE_STYLES[styleKey] ?? NODE_STYLES.canonical;

  const label =
    type === 'finalized' || type === 'justified' || type === 'detached'
      ? type.toUpperCase()
      : validity.toUpperCase();

  return (
    <div
      id={id}
      className={classNames(
        'absolute flex cursor-pointer flex-col items-center justify-center gap-3 rounded-full transition-[filter] duration-150 hover:brightness-110',
        styles.fill,
        styles.glow,
        className,
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
      onClick={() => onClick?.(hash)}
    >
      <ProgressCircle
        progress={weightPercentageComparedToHeaviestNeighbor}
        radius={radius}
        className="absolute"
        color={styles.arc}
        backgroundColor={styles.track}
      />
      <p
        className={classNames(
          'mb-3 font-mono text-xl font-semibold uppercase tracking-widest',
          styles.label,
        )}
      >
        {label}
      </p>
      <p className="font-mono text-3xl font-semibold text-foreground-strong">
        {hash.substring(0, 6)}…{hash.substring(hash.length - 4)}
      </p>
      <p className="mt-3 font-mono text-xl tabular-nums text-foreground/70">
        {weight && weight !== '0' ? weight : ' '}
      </p>
    </div>
  );
}

export default memo(WeightedNode);
