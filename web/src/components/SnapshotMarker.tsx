import { memo } from 'react';

function SnapshotMarker({
  secondsPerSlot,
  timeIntoSlot,
  active,
}: {
  secondsPerSlot: number;
  active: boolean;
  timeIntoSlot: number;
}) {
  const leftPercentage = (timeIntoSlot / (secondsPerSlot * 1000)) * 100;
  return (
    <div
      className="absolute"
      style={{
        left: `${leftPercentage}%`,
      }}
    >
      <span className="relative flex h-10 w-1 pt-2">
        {active && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-10 w-1 bg-sky-500"></span>
      </span>
    </div>
  );
}

export default memo(SnapshotMarker);
