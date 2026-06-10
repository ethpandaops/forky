import classNames from 'clsx';

function ConcatNode({
  id,
  slotStart,
  slotEnd,
  x,
  y,
  radius,
  className,
}: {
  id?: string;
  slotStart: number;
  slotEnd: number;
  x: number;
  y: number;
  radius: number;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={classNames(
        'absolute flex flex-col items-center justify-center rounded-full gap-3 shadow-inner-xl',
        'border-dashed border-2 border-faint',
        'bg-field',
        className,
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
    >
      <p className="text-foreground-strong text-xl font-mono">CONCAT</p>
      <p className="text-foreground-strong text-2xl font-mono">
        {slotStart} → {slotEnd}
      </p>
    </div>
  );
}

export default ConcatNode;
