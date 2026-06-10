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
            'w-1 border-l border-tick',
            i === 0 ? 'h-full' : isCentimeter ? 'h-2' : 'h-1',
            isCentimeter ? '' : 'opacity-50',
          )}
        >
          {markText && isCentimeter && i !== 0 && i != totalSubmarks && (
            <span
              className={classNames(
                'relative font-mono text-[8px]/3 tabular-nums text-tick-label',
                flip ? '-top-5 mt-5' : 'top-0',
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
          'absolute flex w-full h-full items-baseline justify-end',
          flip ? 'flex-col-reverse' : 'flex-col',
        )}
      >
        <div className={classNames(flip ? 'mb-5' : 'mt-5')}></div>
        <div className="h-full w-full pr-1">{children}</div>
        {summary && (
          <span className="whitespace-nowrap pl-1.5 font-mono text-[10px]/4 uppercase tracking-wider tabular-nums text-active">
            {summary}
          </span>
        )}
      </div>
      <div
        className={classNames('flex justify-between w-full', flip ? 'items-end' : 'items-start')}
      >
        {generateRulerMarks()}
      </div>
    </div>
  );
};

export default Ruler;
