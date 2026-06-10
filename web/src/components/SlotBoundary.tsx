import { memo } from 'react';

import classNames from 'clsx';

function SlotBoundary({
  slot,
  epoch,
  x,
  y,
  width,
  height,
  className,
  textOffset,
}: {
  slot?: number;
  epoch?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  className?: string;
  textOffset: number;
}) {
  return (
    <div className="transition-opacity duration-300 starting:opacity-0">
      <div
        className={classNames('absolute px-0 py-0 m-0 leading-none', className)}
        style={{
          left: `${x - width / 2}px`,
          top: `${y}px`,
          width,
          height,
        }}
      ></div>
      {epoch && (
        <p
          className="absolute px-0 py-0 m-0 leading-none text-foreground pl-5 whitespace-nowrap text-2xl font-bold text-opacity-75 dark:text-opacity-75 font-mono"
          style={{
            left: `${x - width / 2}px`,
            top: `${y + height / 2 + textOffset + 30}px`,
          }}
        >
          EPOCH {epoch}
        </p>
      )}
      {slot && (
        <p
          className="absolute px-0 py-0 m-0 leading-none text-foreground pl-5 whitespace-nowrap text-2xl font-bold text-opacity-75 dark:text-opacity-75 font-mono"
          style={{
            left: `${x - width / 2}px`,
            top: `${y + height / 2 + textOffset}px`,
          }}
        >
          SLOT {slot}
        </p>
      )}
    </div>
  );
}

export default memo(SlotBoundary);
