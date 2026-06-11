import { ReactNode, useState } from 'react';

import { CheckIcon, DocumentDuplicateIcon, EyeIcon, FlagIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';

import { truncateHash } from '@app/utils/strings';
import { NODE_STYLES, NodeStyleKey } from '@utils/nodeStyles';

/* Read-only content for the graph hover cards (see HoverCard). One variant
 * per graph primitive; all of them stay presentational so Storybook can
 * render every state without pointer choreography. Hierarchy follows the
 * dashboard-tooltip playbook: the hero numbers live in stat tiles, the
 * supporting rows stay small and muted, and key values carry their status
 * color. */

/* Mainnet weights run to 15+ digits — too wide for a stat tile. Past a
 * billion, display compact notation (e.g. 393.23T) and keep the exact
 * value reachable via the title attribute. */
function formatWeight(weight: string): { display: string; full: string } {
  try {
    const value = BigInt(weight);
    const full = value.toLocaleString();
    if (value >= 1_000_000_000n) {
      return {
        display: new Intl.NumberFormat('en', {
          notation: 'compact',
          maximumFractionDigits: 2,
        }).format(Number(value)),
        full,
      };
    }
    return { display: full, full };
  } catch {
    return { display: weight, full: weight };
  }
}

function validityStyleKey(validity: string): NodeStyleKey {
  const normalized = validity.toLowerCase();
  if (normalized === 'valid') return 'canonical';
  if (normalized === 'optimistic') return 'optimistic';
  return 'invalid';
}

function ValidityBadge({ validity }: { validity: string }) {
  const styles = NODE_STYLES[validityStyleKey(validity)];
  return (
    <span
      className={classNames(
        'rounded-sm px-1.5 py-0.5 font-mono text-[10px]/4 font-semibold uppercase tracking-widest',
        styles.fill,
        styles.label,
      )}
    >
      {validity.toUpperCase()}
    </span>
  );
}

/* Inline weight-share meter echoing the node's progress ring. */
function ShareMeter({ percentage, styleKey }: { percentage: number; styleKey: NodeStyleKey }) {
  const styles = NODE_STYLES[styleKey];
  const rounded = Math.round(percentage);
  return (
    <span className="flex items-center gap-1.5">
      <span className={classNames('font-semibold', styles.label)}>{rounded}%</span>
      <span className="h-1 min-w-0 grow overflow-hidden rounded-full bg-track">
        <span
          className={classNames('block h-full rounded-full bg-current', styles.label)}
          style={{ width: `${Math.min(100, Math.max(0, rounded))}%` }}
        />
      </span>
    </span>
  );
}

function SourceCount({
  count,
  total,
  className,
}: {
  count: number;
  total: number;
  className?: string;
}) {
  return (
    <>
      <span className={classNames('font-semibold', className ?? 'text-foreground-strong')}>
        {count}/{total}
      </span>{' '}
      <span className="text-muted">sources</span>
    </>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      aria-label={copied ? 'Copied' : label}
      className="shrink-0 rounded-sm p-1 text-muted transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground"
      onClick={async event => {
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          // clipboard unavailable (permissions/insecure context) — ignore
        }
      }}
    >
      {copied ? (
        <CheckIcon className="size-3.5 text-success" />
      ) : (
        <DocumentDuplicateIcon className="size-3.5" />
      )}
    </button>
  );
}

/* Inset stat tile for the card's hero numbers. */
function CardStat({
  label,
  children,
  valueClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md bg-surface px-2 py-1.5">
      <span className="flex items-center gap-1 text-[10px]/4 font-medium uppercase tracking-wider text-faint">
        {label}
      </span>
      <span
        className={classNames(
          'font-mono text-sm/5 font-semibold tabular-nums',
          valueClassName ?? 'text-foreground-strong',
        )}
      >
        {children}
      </span>
    </div>
  );
}

function CardRow({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex items-center gap-1 text-xs text-muted">{label}</dt>
      <dd className="text-right font-mono text-xs tabular-nums text-foreground">{children}</dd>
    </div>
  );
}

function CardShell({
  styleKey,
  status,
  slot,
  epoch,
  blockRoot,
  children,
}: {
  styleKey: NodeStyleKey;
  status: string;
  slot?: number;
  epoch?: number;
  blockRoot: string;
  children: ReactNode;
}) {
  const styles = NODE_STYLES[styleKey];

  return (
    <div className="flex flex-col gap-2">
      {/* the chips share the row with short statuses and wrap below on
       * mainnet-scale slot/epoch numbers instead of overflowing */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-1.5">
          <span
            className={classNames(
              'size-2.5 shrink-0 rounded-full border border-current',
              styles.fill,
              styles.arc,
            )}
          />
          <span
            className={classNames(
              'font-mono text-xs font-semibold uppercase tracking-widest',
              styles.label,
            )}
          >
            {status}
          </span>
        </span>
        {slot !== undefined && (
          <span className="flex flex-wrap items-center gap-1 font-mono text-[10px]/4 tabular-nums text-muted">
            <span className="rounded-sm bg-surface px-1.5 py-0.5">
              slot{' '}
              <span className="font-semibold text-foreground-strong">{slot.toLocaleString()}</span>
            </span>
            {epoch !== undefined && (
              <span className="rounded-sm bg-surface px-1.5 py-0.5">
                epoch{' '}
                <span className="font-semibold text-foreground-strong">
                  {epoch.toLocaleString()}
                </span>
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex items-start gap-1">
        <p className="min-w-0 grow break-all font-mono text-xs/4 text-foreground-strong">
          {blockRoot}
        </p>
        <CopyButton value={blockRoot} label="Copy block root" />
      </div>
      <div className="flex flex-col gap-2 border-t border-border pt-2">{children}</div>
      <p className="flex items-center justify-between gap-4 text-xs text-faint">
        <span>Click the block for full details</span>
        <span className="flex items-center gap-1">
          <kbd className="rounded-sm border border-border bg-surface px-1 font-mono text-[10px]/4">
            esc
          </kbd>
          to dismiss
        </span>
      </p>
    </div>
  );
}

export function WeightedNodeCard({
  styleKey,
  status,
  blockRoot,
  parentRoot,
  slot,
  epoch,
  validity,
  weight,
  weightPercentage,
}: {
  styleKey: NodeStyleKey;
  status: string;
  blockRoot: string;
  parentRoot?: string;
  slot?: number;
  epoch?: number;
  validity: string;
  weight: string;
  weightPercentage: number;
}) {
  const formattedWeight = weight && weight !== '0' ? formatWeight(weight) : undefined;

  return (
    <CardShell styleKey={styleKey} status={status} slot={slot} epoch={epoch} blockRoot={blockRoot}>
      <div className="flex gap-1.5">
        <CardStat label="Weight">
          {formattedWeight ? (
            <span title={formattedWeight.full}>{formattedWeight.display}</span>
          ) : (
            '—'
          )}
        </CardStat>
        <CardStat label="Branch share">
          <ShareMeter percentage={weightPercentage} styleKey={styleKey} />
        </CardStat>
      </div>
      <dl className="flex flex-col gap-1">
        <CardRow label="Validity">
          <ValidityBadge validity={validity} />
        </CardRow>
        {parentRoot && <CardRow label="Parent">{truncateHash(parentRoot)}</CardRow>}
      </dl>
    </CardShell>
  );
}

export function AggregatedNodeCard({
  styleKey,
  status,
  blockRoot,
  slot,
  epoch,
  seen,
  canonical,
  finalizedCheckpoints,
  justifiedCheckpoints,
  orphans,
  valid,
  optimistic,
  total,
}: {
  styleKey: NodeStyleKey;
  status: string;
  blockRoot: string;
  slot?: number;
  epoch?: number;
  seen: number;
  canonical: number;
  finalizedCheckpoints: number;
  justifiedCheckpoints: number;
  orphans: number;
  valid: number;
  optimistic: number;
  total: number;
}) {
  const notValid = seen - valid;

  return (
    <CardShell styleKey={styleKey} status={status} slot={slot} epoch={epoch} blockRoot={blockRoot}>
      <div className="flex gap-1.5">
        <CardStat
          label={
            <>
              <CheckIcon className="size-3" /> Canonical
            </>
          }
          valueClassName="text-canonical"
        >
          {canonical}/{total}
        </CardStat>
        <CardStat
          label={
            <>
              <EyeIcon className="size-3" /> Seen by
            </>
          }
        >
          {seen}/{total}
        </CardStat>
      </div>
      {(finalizedCheckpoints > 0 ||
        justifiedCheckpoints > 0 ||
        notValid > 0 ||
        optimistic > 0 ||
        orphans > 0) && (
        <dl className="flex flex-col gap-1">
          {finalizedCheckpoints > 0 && (
            <CardRow
              label={
                <>
                  <FlagIcon className="size-3.5" /> Finalized votes
                </>
              }
            >
              <span className="font-semibold text-finalized">
                {finalizedCheckpoints}/{total}
              </span>
            </CardRow>
          )}
          {justifiedCheckpoints > 0 && (
            <CardRow
              label={
                <>
                  <FlagIcon className="size-3.5" /> Justified votes
                </>
              }
            >
              <span className="font-semibold text-justified">
                {justifiedCheckpoints}/{total}
              </span>
            </CardRow>
          )}
          {notValid > 0 && (
            <CardRow label="Not valid for">
              <SourceCount count={notValid} total={total} className="text-invalid" />
            </CardRow>
          )}
          {optimistic > 0 && (
            <CardRow label="Optimistic for">
              <SourceCount count={optimistic} total={total} className="text-optimistic" />
            </CardRow>
          )}
          {orphans > 0 && (
            <CardRow label="Detached for">
              <SourceCount count={orphans} total={total} className="text-invalid" />
            </CardRow>
          )}
        </dl>
      )}
    </CardShell>
  );
}

export function TruncationCard({ slots }: { slots: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">
        Hidden range
      </p>
      <p className="text-xs/4 text-foreground">
        <span className="font-mono font-semibold text-foreground-strong">
          {slots.toLocaleString()}
        </span>{' '}
        earlier slots are collapsed to keep the graph readable. The{' '}
        <span className="font-medium text-finalized">finalized</span> and{' '}
        <span className="font-medium text-justified">justified</span> checkpoints stay pinned just
        left of this gap.
      </p>
    </div>
  );
}
