import { memo, useState, FocusEvent } from 'react';

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { ShareIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { usePathname } from '@hooks/useAppNavigation';

import useFocus from '@contexts/focus';

function Share() {
  const location = usePathname();
  const { time, playing } = useFocus();
  const [open, setOpen] = useState(false);

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    event.target.select();
  }

  function generateLink() {
    const url = new URL(window.location.toString().split('?', 1)[0]);
    if (!playing) url.searchParams.set('t', time.toString());
    return url.toString();
  }

  // Close the dialog when the route actually changes, adjusting state
  // during render instead of in an effect.
  const [prevLocation, setPrevLocation] = useState(location);
  if (prevLocation !== location) {
    setPrevLocation(location);
    if (open) {
      setOpen(false);
    }
  }

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        title="Share link"
        className="glass-chrome fixed top-16 right-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted shadow-md transition-colors duration-150 hover:text-foreground lg:right-6"
      >
        <ShareIcon className="size-5" />
      </span>
      <Dialog open={open} className="relative z-40" onClose={setOpen}>
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-scrim transition-opacity duration-300 ease-out data-[leave]:duration-200 data-[leave]:ease-in data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-xl border border-border bg-surface px-4 pt-5 pb-4 text-left shadow-xl transition-all duration-200 ease-out data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[leave]:duration-150 data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
            >
              <p className="font-mono text-[10px]/4 font-semibold uppercase tracking-widest text-faint">
                Share this view
              </p>
              <div className="mt-3">
                <input
                  type="text"
                  name="link"
                  value={generateLink()}
                  spellCheck="false"
                  className="block w-full rounded-lg border border-border-strong bg-field px-2.5 py-1.5 font-mono text-xs/5 text-foreground transition-colors duration-150 placeholder:text-faint focus:border-accent focus:outline-hidden"
                  onFocus={handleFocus}
                  readOnly
                />
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary shadow-xs transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  onClick={() => {
                    navigator.clipboard.writeText(generateLink());
                    setOpen(false);
                  }}
                >
                  <ClipboardDocumentCheckIcon className="size-5" />
                  Copy link
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default memo(Share);
