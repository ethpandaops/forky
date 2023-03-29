import React from 'react';

import classNames from 'classnames';

interface RulerProps {
  summary: string;
  marks: number;
  subMarks?: number;
  markText?: boolean;
  markSuffix?: string;
  flip?: boolean;
  className?: string;
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
  children,
}) => {
  const subMarksInterval = (subMarks ?? 0) + 1;
  const totalSubmarks = marks * subMarksInterval;

  const generateRulerMarks = () => {
    const marks = [];
    for (let i = 0; i <= totalSubmarks; i++) {
      const isCentimeter = i % subMarksInterval === 0;

      marks.push(
        <div
          key={i}
          className={classNames(
            'border-l border-black w-1',
            i === 0 ? 'h-full' : isCentimeter ? 'h-2' : 'h-1',
            isCentimeter ? '' : 'opacity-60',
          )}
        >
          {markText && isCentimeter && i !== 0 && i != totalSubmarks && (
            <span
              className={classNames(
                'text-black text-opacity-60 relative text-xs left-0.5',
                flip ? '-top-5 mt-5' : '',
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
    <div className={classNames('flex select-none', className)}>
      <div
        className={classNames(
          'absolute flex items-baseline flex-col justify-end w-full h-full ',
          flip ? 'flex-col-reverse' : 'flex-col',
        )}
      >
        <div className={classNames(flip ? 'mb-5' : 'mt-5')}></div>
        <div className="pr-1 w-full h-full">{children}</div>
        {summary && (
          <span className="whitespace-nowrap text-black text-opacity-40 text-xs pl-1">
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
