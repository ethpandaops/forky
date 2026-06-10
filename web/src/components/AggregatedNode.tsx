import { memo } from 'react';

import { EyeIcon, CheckIcon, FlagIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';

import ProgressCircle from '@components/ProgressCircle';

/* Mirrors the WeightedNode status recipe: dim core, bright rim, soft glow. */
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

function AggregatedNode({
  id,
  hash,
  type,
  seen,
  canonical,
  finalizedCheckpoints,
  justifiedCheckpoints,
  orphans,
  valid,
  optimistic,
  total,
  x,
  y,
  radius,
  className,
  onClick,
}: {
  id?: string;
  hash: string;
  type: 'canonical' | 'fork';
  seen: number;
  canonical: number;
  finalizedCheckpoints: number;
  justifiedCheckpoints: number;
  orphans: number;
  valid: number;
  optimistic: number;
  total: number;
  x: number;
  y: number;
  radius: number;
  className?: string;
  onClick?: (hash: string) => void;
}) {
  const [styleKey, title] = ((): [string, string] => {
    if (valid !== seen) return ['invalid', `${seen - valid} NOT VALID`];
    if (orphans > 0) return ['invalid', `${orphans} DETACHED`];
    if (finalizedCheckpoints > 0) return ['finalized', 'FINALIZED'];
    if (justifiedCheckpoints > 0) return ['justified', 'JUSTIFIED'];

    switch (type) {
      case 'canonical':
        if (optimistic > 0) return ['optimistic', `${optimistic}/${valid} OPTIMISTIC`];
        return ['canonical', 'VALID'];
      case 'fork':
        return ['fork', optimistic > 0 ? `${optimistic}/${valid} OPTIMISTIC` : 'VALID'];
      default:
        return ['canonical', type];
    }
  })();
  const styles = NODE_STYLES[styleKey] ?? NODE_STYLES.canonical;

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
        progress={(canonical / total) * 100}
        radius={radius}
        className="absolute"
        color={styles.arc}
        backgroundColor={styles.track}
      />
      <p
        className={classNames(
          'h-16 pt-6 font-mono text-xl font-semibold uppercase tracking-widest',
          styles.label,
        )}
      >
        {title}
      </p>
      <p className="font-mono text-3xl font-semibold text-foreground-strong">
        {hash.substring(0, 6)}…{hash.substring(hash.length - 4)}
      </p>
      <p className="flex h-16 gap-6 pt-2 font-mono text-xl tabular-nums text-foreground/70">
        <span className="flex flex-col items-center gap-1">
          {finalizedCheckpoints > 0 || justifiedCheckpoints > 0 ? (
            <>
              <FlagIcon className="size-5" /> {finalizedCheckpoints || justifiedCheckpoints}/{total}
            </>
          ) : (
            <>
              <CheckIcon className="size-5" /> {canonical}/{total}
            </>
          )}
        </span>
        <span className="flex flex-col items-center gap-1">
          <EyeIcon className="size-5" /> {seen}/{total}
        </span>
      </p>
    </div>
  );
}

export default memo(AggregatedNode);
