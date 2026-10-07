import { CSSProperties, memo } from 'react';

import {
  CheckIcon,
  ClockIcon,
  CubeIcon,
  CubeTransparentIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import classNames from 'clsx';

import useTideSlosh from '@hooks/useTideSlosh';
import { PAYLOAD_STAGES, PayloadStage } from '@utils/payload';

const STAGE_ICONS: Record<PayloadStage, typeof CubeIcon> = {
  awaiting: ClockIcon,
  voting: HandRaisedIcon,
  timely: CheckIcon,
  late: ExclamationTriangleIcon,
  undecided: ScaleIcon,
  full: CubeIcon,
  empty: CubeTransparentIcon,
};

/* Tide: a Gloas block's execution payload as liquid inside its graph node.
 * The level rises with the PTC vote and settles near the top once the
 * payload is full; an empty payload drains, leaving a dashed rim, and an
 * awaited one shows a blinking waterline. Sits behind the node's ring and
 * text, so the node's status colors stay in charge. With `slosh` (the lead
 * nodes) the liquid rocks as the graph canvas is panned, and crashes with a
 * little spray off its crest when it sloshes hard. */
function PayloadTide({
  stage,
  level,
  slosh = false,
}: {
  stage: PayloadStage;
  level: number;
  slosh?: boolean;
}) {
  const style = PAYLOAD_STAGES[stage];
  const still = style.motion === 'still';
  const { liquidRef, crestRef, spray, settleSpray } = useTideSlosh(slosh && level > 0, level);

  // The waves stay mounted at every level (below the node when drained) so a
  // change of level always eases rather than popping in or out. The back wave
  // rides just above the crest: turning the other way, slower and rounder, it
  // shows as a soft shaded lip over the crest line that swells and thins.
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      <div ref={liquidRef} className="absolute inset-0">
        <div
          className={classNames('tide-wave tide-wave-back', style.body, still && 'tide-still')}
          style={{ top: `${level > 0 ? 100 - level - 2.5 : 104}%` }}
        />
        <div
          ref={crestRef}
          className={classNames('tide-wave', style.crest, still && 'tide-still')}
          style={{ top: `${level > 0 ? 100 - level - 1 : 104}%` }}
        />
      </div>
      {spray.map(drop => (
        <span
          key={drop.id}
          className="tide-spray bg-payload-surface"
          style={
            {
              left: `${drop.x}%`,
              top: `${drop.y}%`,
              width: `${drop.size}%`,
              height: `${drop.size}%`,
              '--tide-spray-dx': `${drop.dx}%`,
              '--tide-spray-rise': `${drop.rise}%`,
              '--tide-spray-fall': `${drop.fall}%`,
              '--tide-spray-duration': `${drop.duration}s`,
              '--tide-spray-delay': `${drop.delay}s`,
            } as CSSProperties
          }
          onAnimationEnd={() => settleSpray(drop.id)}
        />
      ))}
      {stage === 'awaiting' && (
        <div className="tide-blink absolute inset-x-[24%] bottom-[11%] border-t-4 border-dashed border-muted" />
      )}
      {stage === 'empty' && (
        <div className="absolute inset-[9%] rounded-full border-4 border-dashed border-payload/70" />
      )}
    </div>
  );
}

/* The payload's stage, inside the node under the block's hash. `value` is
 * the PTC count while voting, or the agreeing sources in aggregated views. */
export function PayloadChip({ stage, value }: { stage: PayloadStage; value?: string }) {
  const style = PAYLOAD_STAGES[stage];
  const Icon = STAGE_ICONS[stage];

  return (
    <span
      className={classNames(
        'relative flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-lg font-bold uppercase tracking-wider',
        style.chip,
      )}
    >
      <Icon className="size-6 stroke-2" />
      <span className={classNames(stage === 'empty' && 'line-through decoration-2')}>
        {style.short}
      </span>
      {value && <span className="tabular-nums opacity-75">{value}</span>}
    </span>
  );
}

export default memo(PayloadTide);
