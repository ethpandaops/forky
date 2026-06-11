import { HTMLAttributes, HTMLProps, ReactNode, Ref, useRef, useState } from 'react';

import {
  FloatingArrow,
  FloatingPortal,
  arrow,
  autoUpdate,
  flip,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';
import classNames from 'clsx';

import { NODE_STYLES, NodeStyleKey } from '@utils/nodeStyles';

/* The card chrome, exported on its own so Storybook can render every card
 * variant statically without pointer choreography. Content panels stay
 * solid (not glass) for readability, matching the design language. An
 * accent ties the card to its node's status family: a hairline bar along
 * the top edge and a soft halo in the status ring color. */
export function HoverCardPanel({
  ref,
  accent,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement>; accent?: NodeStyleKey }) {
  return (
    <div
      ref={ref}
      {...rest}
      className={classNames(
        'relative w-80 overflow-hidden rounded-lg border border-border bg-surface-raised p-3',
        accent ? NODE_STYLES[accent].cardGlow : 'shadow-lg',
        className,
      )}
    >
      {accent && (
        <span
          aria-hidden="true"
          className={classNames(
            'absolute inset-x-0 top-0 h-0.5 bg-current',
            NODE_STYLES[accent].label,
          )}
        />
      )}
      {children}
    </div>
  );
}

/* Hover/keyboard-focus details card for graph elements. Renders through a
 * portal so it escapes the zoom-pan transform (it would scale and blur with
 * the graph otherwise) and re-anchors every animation frame so it follows
 * its node while the canvas pans. Enters with a quick ease-out fade/rise
 * from the anchor side; an arrow ties it to the node. WCAG 1.4.13:
 * hoverable (safePolygon lets the pointer travel onto the card),
 * dismissible (Escape) and persistent (no auto-timeout). Pointer-only by
 * design — tapping a node already opens the full details slide-over. */
function HoverCard({
  content,
  accent,
  referenceProps,
  children,
}: {
  content: ReactNode;
  accent?: NodeStyleKey;
  referenceProps?: HTMLProps<HTMLElement>;
  children: (props: Record<string, unknown>) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    middleware: [
      offset(16),
      flip({ padding: 12 }),
      shift({ padding: 12 }),
      // react-hooks/refs: the middleware reads the ref during positioning
      // (floating-ui's documented pattern), not during render
      // eslint-disable-next-line react-hooks/refs
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, { animationFrame: true }),
  });

  const hover = useHover(context, {
    delay: { open: 150, close: 75 },
    handleClose: safePolygon(),
    mouseOnly: true,
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context, { referencePress: true });
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 180, close: 120 },
    initial: ({ side }) => ({
      opacity: 0,
      transform: side === 'bottom' ? 'translateY(-8px) scale(0.96)' : 'translateY(8px) scale(0.96)',
    }),
  });

  /* react-hooks/refs: floating-ui's refs.setReference/refs.setFloating are
   * stable callback refs meant to be attached during render — not ref
   * reads, so the rule's heuristic misfires here. */
  return (
    <>
      {}
      {children({ ref: refs.setReference, ...getReferenceProps(referenceProps) })}
      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-40"
          >
            <div style={transitionStyles}>
              <HoverCardPanel accent={accent}>{content}</HoverCardPanel>
              <FloatingArrow
                ref={arrowRef}
                context={context}
                width={16}
                height={8}
                tipRadius={2}
                strokeWidth={1}
                style={{ fill: 'var(--color-surface-raised)', stroke: 'var(--color-border)' }}
              />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export default HoverCard;
