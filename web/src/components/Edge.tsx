import { memo } from 'react';

import classNames from 'clsx';

function Edge({
  x1,
  x2,
  y1,
  y2,
  thickness,
  className,
}: {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  thickness: number;
  className?: string;
}) {
  const length = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));

  const cx = (x1 + x2) / 2 - length / 2;
  const cy = (y1 + y2) / 2 - thickness / 2;

  const angle = Math.atan2(y1 - y2, x1 - x2) * (180 / Math.PI);

  const lineStyle = {
    height: thickness,
    left: `${cx}px`,
    top: `${cy}px`,
    width: `${length}px`,
    transform: `rotate(${angle}deg)`,
  };

  return (
    <div
      className={classNames('absolute px-0 py-0 m-0 leading-none', className)}
      style={lineStyle}
    />
  );
}

export default memo(Edge);
