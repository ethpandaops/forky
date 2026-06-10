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
        className="fixed z-10 right-6 lg:right-8 top-20 text-muted cursor-pointer w-10 h-10 rounded-md transition hover:bg-overlay/5"
      >
        <ShareIcon className="fixed h-8 w-8 m-1" />
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
              className="duration-300 ease-out data-[leave]:duration-200 data-[leave]:ease-in data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95 relative transform overflow-hidden rounded-lg bg-surface-raised px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6"
            >
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <div className="mt-2">
                    <input
                      type="text"
                      name="link"
                      value={generateLink()}
                      spellCheck="false"
                      className="block w-full rounded-md border-0 py-1.5 px-2 bg-track text-foreground shadow-sm ring-1 ring-border-strong placeholder:text-faint focus:ring-2 focus:ring-inset focus:ring-active disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted disabled:ring-border sm:text-sm sm:leading-6"
                      onFocus={handleFocus}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex w-full justify-center items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(generateLink());
                    setOpen(false);
                  }}
                >
                  <ClipboardDocumentCheckIcon className="w-7 h-7 pr-2" />
                  Copy
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
