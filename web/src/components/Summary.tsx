import { ReactNode } from 'react';

import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import classNames from 'clsx';

import Link from '@components/Link';

/**
 * Shared building blocks for the slide-out selection panel: a compact,
 * consistent key/value card used by every summary state (snapshot, block,
 * aggregated, BYO).
 */

export function SummaryCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-4 sm:mx-6 overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <dl className="divide-y divide-border">{children}</dl>
    </div>
  );
}

export function SummaryRow({
  label,
  mono = false,
  children,
}: {
  label: string;
  mono?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="items-baseline px-4 py-2.5 sm:grid sm:grid-cols-[10.5rem_1fr] sm:gap-4 sm:px-5">
      <dt className="font-mono text-[10px]/5 font-medium uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd
        className={classNames(
          'mt-0.5 break-all text-sm/5 text-foreground sm:mt-0',
          mono && 'font-mono text-xs',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

export function SummarySection({ title }: { title: string }) {
  return (
    <div className="bg-background/60 px-4 pb-1.5 pt-3.5 sm:px-5">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-widest text-faint">
        {title}
      </dt>
    </div>
  );
}

export function SummaryLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="font-medium text-link transition hover:text-link-hover hover:underline"
    >
      {children}
      <ArrowTopRightOnSquareIcon
        className="ml-1 inline h-3.5 w-3.5 align-[-2px]"
        aria-hidden="true"
      />
    </Link>
  );
}

const VALIDITY_STYLES: Record<string, string> = {
  valid: 'bg-canonical-edge/40 text-canonical ring-canonical-edge',
  optimistic: 'bg-optimistic-edge/40 text-optimistic ring-optimistic-edge',
};

export function ValidityBadge({ validity }: { validity: string }) {
  const style =
    VALIDITY_STYLES[validity.toLowerCase()] ?? 'bg-invalid-edge/40 text-invalid ring-invalid-edge';

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        style,
      )}
    >
      {validity}
    </span>
  );
}
