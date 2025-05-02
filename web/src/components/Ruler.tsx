import React from 'react';

import classNames from 'clsx';

interface RulerProps {
  summary: string;
  marks: number;
  subMarks?: number;
  markText?: boolean;
  markSuffix?: string;
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Ruler: React.FC<RulerProps> = ({
  summary,
  marks,
  subMarks,
  markText,
  markSuffix,
  flip = false,
  className,
  style,
  children,
}) => {
  const subMarksInterval = (subMarks ?? 0) + 1;
  const totalSubmarks = marks * subMarksInterval - 1;

  const generateRulerMarks = () => {
    const marks = [];
    for (let i = 0; i <= totalSubmarks; i++) {
      const isCentimeter = i % subMarksInterval === 0;

      marks.push(
        <div
          key={i}
          className={classNames(
            'border-l w-1 border-stone-500 dark:border-stone-400',
            i === 0 ? 'h-full' : isCentimeter ? 'h-2' : 'h-1',
            isCentimeter ? '' : 'opacity-60',
          )}
        >
          {markText && isCentimeter && i !== 0 && i != totalSubmarks && (
            <span
              className={classNames(
                ' text-stone-800 dark:text-stone-500 relative text-[9px]',
                flip ? '-top-5 mt-5' : '-top-0.5',
              )}
            >
              {i / subMarksInterval}
              {markSuffix ? markSuffix : ''}
            </span>
          )}
        </div>,
      );
    }
    return marks;
  };

  return (
    <div className={classNames('flex select-none', className)} style={style}>
      <div
        className={classNames(
          'absolute flex items-baseline flex-col justify-end w-full h-full',
          flip ? 'flex-col-reverse' : 'flex-col',
        )}
      >
        <div className={classNames(flip ? 'mb-5' : 'mt-5')}></div>
        <div className="pr-1 w-full h-full">{children}</div>
        {summary && (
          <span className="whitespace-nowrap pl-1 text-xs text-stone-600 dark:text-stone-400">
            {summary}
          </span>
        )}
      </div>
      <div
        className={classNames('flex  justify-between w-full', flip ? 'items-end' : 'items-start')}
      >
        {generateRulerMarks()}
      </div>
    </div>
  );
};

export default Ruler;
