import React from 'react';

interface ScrollProgressProps {
  progress: number;
  radius: number;
  className?: string;
  color: string;
  backgroundColor: string;
}

const ScrollProgress: React.FC<ScrollProgressProps> = ({
  progress,
  radius,
  className,
  backgroundColor,
  color,
}) => {
  const stroke = 16;
  const innerRadius = radius - stroke / 2 + 2;
  const circumference = innerRadius * 2 * Math.PI;
  const adjustedProgress = Math.min(Math.max(progress, 0), 100);
  const center = radius + stroke / 2;

  return (
    <svg className={className} style={{ width: radius * 2 + stroke, height: radius * 2 + stroke }}>
      <circle
        className={backgroundColor}
        strokeWidth={stroke}
        stroke="currentColor"
        fill="transparent"
        r={innerRadius}
        cx={center}
        cy={center}
      />
      <circle
        className={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference - (adjustedProgress / 100) * circumference}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={innerRadius}
        cx={center}
        cy={center}
        style={{
          transformOrigin: 'center',
          transform: 'rotate(-90deg)',
        }}
      />
    </svg>
  );
};

export default ScrollProgress;
