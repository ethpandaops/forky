import { memo, useState } from 'react';

import { CheckIcon, EyeIcon, FlagIcon } from '@heroicons/react/20/solid';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import classNames from 'clsx';

import { NODE_STYLES, NodeStyleKey } from '@utils/nodeStyles';
import { PAYLOAD_STAGE_ORDER, PAYLOAD_STAGES } from '@utils/payload';

/* Stage legend for the fork-choice graph's visual vocabulary. Collapsed to
 * a compact pill by default (mobile stays clean); expands into a glass
 * panel mirroring the Sources panel chrome. Swatches render from the same
 * NODE_STYLES table as the real nodes, so the legend cannot drift. Rows are
 * mode-aware: the progress ring and the footer counters mean different
 * things in weighted vs aggregated views. */

type LegendMode = 'weighted' | 'aggregated';

const BLOCK_ENTRIES: {
  styleKey: NodeStyleKey;
  name: string;
  description: Record<LegendMode, string>;
}[] = [
  {
    styleKey: 'canonical',
    name: 'Canonical',
    description: {
      weighted: 'On the heaviest (head) chain',
      aggregated: 'Head chain across the sources',
    },
  },
  {
    styleKey: 'fork',
    name: 'Fork',
    description: {
      weighted: 'Competing branch with less weight',
      aggregated: 'Competing branch on some sources',
    },
  },
  {
    styleKey: 'optimistic',
    name: 'Optimistic',
    description: {
      weighted: 'Execution payload not yet verified',
      aggregated: 'Optimistic on some sources',
    },
  },
  {
    styleKey: 'justified',
    name: 'Justified',
    description: {
      weighted: 'Latest justified checkpoint',
      aggregated: 'Justified checkpoint on the sources',
    },
  },
  {
    styleKey: 'finalized',
    name: 'Finalized',
    description: {
      weighted: 'Latest finalized checkpoint',
      aggregated: 'Finalized checkpoint on the sources',
    },
  },
  {
    styleKey: 'invalid',
    name: 'Invalid',
    description: {
      weighted: 'Failed (or unknown) validity',
      aggregated: 'Not valid on some sources',
    },
  },
  {
    styleKey: 'invalid',
    name: 'Detached',
    description: {
      weighted: 'Parent block missing from the view',
      aggregated: 'Parent block missing on some sources',
    },
  },
];

const RING_NOTE: Record<LegendMode, string> = {
  weighted: 'Ring: weight relative to the heaviest competing branch.',
  aggregated: 'Ring: share of sources reporting the block canonical.',
};

const COUNTER_ENTRIES = [
  { Icon: CheckIcon, description: 'Sources with the block on their head chain' },
  { Icon: FlagIcon, description: 'Sources reporting the checkpoint' },
  { Icon: EyeIcon, description: 'Sources that have seen the block' },
];

function StatusSwatch({ styleKey, className }: { styleKey: NodeStyleKey; className?: string }) {
  const styles = NODE_STYLES[styleKey];
  return (
    <span
      className={classNames(
        'size-3 shrink-0 rounded-full border-2 border-current',
        styles.fill,
        styles.arc,
        className,
      )}
    />
  );
}

function Legend({
  mode,
  defaultExpanded = false,
  className,
}: {
  mode: LegendMode;
  defaultExpanded?: boolean;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!expanded) {
    return (
      <button
        aria-label="Show legend"
        className={classNames(
          'glass-chrome flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-muted shadow-md transition-colors duration-150 hover:text-foreground',
          className,
        )}
        onClick={() => setExpanded(true)}
      >
        <span className="flex items-center gap-1">
          {(['canonical', 'fork', 'optimistic', 'justified', 'finalized', 'invalid'] as const).map(
            styleKey => (
              <StatusSwatch key={styleKey} styleKey={styleKey} className="size-2.5 border" />
            ),
          )}
        </span>
        <span className="font-mono text-[10px]/4 font-semibold uppercase tracking-widest">
          Legend
        </span>
        <ChevronUpIcon className="size-4" />
      </button>
    );
  }

  return (
    <div
      className={classNames(
        'glass-chrome flex w-fit max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-xl border border-border px-3 pt-2 pb-2.5 text-foreground shadow-lg max-h-[60dvh] sm:w-72',
        className,
      )}
    >
      <div className="flex w-full items-center justify-between gap-6">
        <span className="font-mono text-[10px]/4 font-semibold uppercase tracking-widest text-faint">
          Legend
        </span>
        <button
          aria-label="Hide legend"
          className="flex items-center rounded p-1 text-xs text-muted transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground"
          onClick={() => setExpanded(false)}
        >
          <ChevronDownIcon className="size-4" />
        </button>
      </div>
      <div className="mt-1.5 mb-2 border-t border-border" />
      <ul className="flex flex-col gap-1.5">
        {BLOCK_ENTRIES.map(({ styleKey, name, description }) => (
          <li key={name} className="flex items-center gap-2 text-xs">
            <StatusSwatch styleKey={styleKey} />
            <span className={classNames('w-16 shrink-0 font-medium', NODE_STYLES[styleKey].label)}>
              {name}
            </span>
            {/* swatch + name carry the legend on phones; prose stays on sm+ */}
            <span className="hidden text-muted sm:inline">{description[mode]}</span>
          </li>
        ))}
        <li className="flex items-center gap-2 text-xs">
          <span className="size-3 shrink-0 rounded-full border-2 border-dashed border-border-strong bg-surface" />
          <span className="w-16 shrink-0 font-medium text-foreground">Hidden</span>
          <span className="hidden text-muted sm:inline">
            Older slots collapsed; checkpoints stay pinned
          </span>
        </li>
      </ul>
      <span className="mt-2 block border-t border-border pt-2 font-mono text-[10px]/4 font-semibold uppercase tracking-widest text-faint">
        Payload (Gloas)
      </span>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {PAYLOAD_STAGE_ORDER.map(stage => {
          const style = PAYLOAD_STAGES[stage];
          return (
            <li key={stage} className="flex items-center gap-2 text-xs">
              {/* the stage's typical payload level */}
              <span
                className={classNames(
                  'relative size-3.5 shrink-0 overflow-hidden rounded-full border bg-surface',
                  stage === 'empty' && 'border-dashed border-payload',
                  stage === 'awaiting' && 'border-dashed border-muted',
                  stage !== 'empty' && stage !== 'awaiting' && 'border-border-strong',
                )}
              >
                <span
                  className={classNames('absolute inset-x-0 bottom-0', style.swatch)}
                  style={{ height: `${style.sampleLevel}%` }}
                />
              </span>
              <span className="w-16 shrink-0 font-medium text-foreground">{style.name}</span>
              <span className="hidden text-muted sm:inline">{style.description}</span>
            </li>
          );
        })}
        <li className="flex items-center gap-2 text-xs">
          <span className="h-1 w-3 shrink-0 rounded-full bg-warning" />
          <span className="w-16 shrink-0 font-medium text-foreground">Edge</span>
          <span className="hidden text-muted sm:inline">Built on the parent's empty payload</span>
        </li>
      </ul>
      <p className="mt-2 hidden border-t border-border pt-2 text-xs text-faint sm:block">
        {RING_NOTE[mode]}
      </p>
      {mode === 'aggregated' && (
        <ul className="mt-1.5 hidden flex-col gap-1 sm:flex">
          {COUNTER_ENTRIES.map(({ Icon, description }) => (
            <li key={description} className="flex items-center gap-2 text-xs text-faint">
              <Icon className="size-3.5 shrink-0" />
              <span>{description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default memo(Legend);
