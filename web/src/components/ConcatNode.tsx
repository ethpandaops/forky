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
        'border-dashed border-2 border-stone-400 dark:border-stone-500',
        'bg-stone-100 dark:bg-stone-700',
        className,
      )}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
      }}
    >
      <p className="text-stone-950 dark:text-stone-50 text-xl font-mono">CONCAT</p>
      <p className="text-stone-950 dark:text-stone-50 text-2xl font-mono">
        {slotStart} → {slotEnd}
      </p>
    </div>
  );
}

export default ConcatNode;
