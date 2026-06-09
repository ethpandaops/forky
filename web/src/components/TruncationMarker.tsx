import { memo } from 'react';

import classNames from 'clsx';

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
    <div
      className={classNames(
        'absolute flex flex-col items-center justify-center gap-6 rounded-full border-dashed border-stone-400 dark:border-stone-500 bg-gradient-to-br from-stone-100 to-stone-300 dark:from-stone-600 dark:to-stone-800 shadow-inner-xl',
        className,
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        borderWidth: '16px',
      }}
      title={`${slots.toLocaleString()} earlier slots hidden`}
    >
      <div className="flex flex-col items-center leading-none">
        <p className="text-stone-700 dark:text-stone-100 text-6xl font-mono font-bold tabular-nums">
          {slots.toLocaleString()}
        </p>
        <p className="mt-3 text-stone-700 dark:text-white text-xl font-mono font-bold uppercase tracking-[0.3em]">
          slots&nbsp;hidden
        </p>
      </div>
    </div>
  );
}

export default memo(TruncationMarker);
