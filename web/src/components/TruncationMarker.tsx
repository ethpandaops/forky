import { memo } from 'react';

import classNames from 'clsx';

import HoverCard from '@components/HoverCard';
import { TruncationCard } from '@components/NodeCards';

/* Bridges a hidden range of the graph when the tail is truncated: rendered
 * in the same circular footprint as graph nodes, in the neutral "gap"
 * language (dashed ring, no status color). */
function TruncationMarker({
  x,
  y,
  radius,
  slots,
  className,
}: {
  x: number;
  y: number;
  radius: number;
  slots: number;
  className?: string;
}) {
  return (
    <HoverCard content={<TruncationCard slots={slots} />}>
      {referenceProps => (
        <div
          {...referenceProps}
          className={classNames(
            'absolute flex flex-col items-center justify-center gap-6 rounded-full',
            'border-8 border-dashed border-border-strong bg-surface',
            className,
          )}
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: `${radius * 2}px`,
            height: `${radius * 2}px`,
          }}
        >
          <div className="flex max-w-full flex-col items-center px-6 leading-none">
            <p className="font-mono text-5xl font-bold tabular-nums text-foreground-strong">
              {slots.toLocaleString()}
            </p>
            <p className="mt-4 font-mono text-lg font-semibold uppercase tracking-[0.25em] text-muted">
              slots&nbsp;hidden
            </p>
          </div>
        </div>
      )}
    </HoverCard>
  );
}

export default memo(TruncationMarker);
