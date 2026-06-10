import Control from '@components/Control';
import EpochDial from '@components/EpochDial';
import SlotDial from '@components/SlotDial';

export default function Timeline() {
  return (
    <div className="fixed bottom-0 left-0 w-full">
      <Control />
      <div className="relative border-t border-timeline-edge bg-timeline">
        <div className="hidden border-b border-timeline-edge xl:block">
          <EpochDial />
        </div>
        <SlotDial />
        {/* Playhead: marks "now" across the dial stack */}
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-accent shadow-[0_0_6px_var(--color-accent)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-0 left-1/2 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
