import { memo, Fragment, useState, FocusEvent, useEffect } from 'react';

import { Dialog, Transition } from '@headlessui/react';
import { ShareIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'wouter';

import useFocus from '@contexts/focus';

function Share() {
  const [location] = useLocation();
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

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [location]);

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        title="Share link"
        className="fixed z-10 right-6 lg:right-8 top-20 text-stone-700 dark:text-stone-300 cursor-pointer w-10 h-10 rounded-md transition hover:bg-stone-900/5 dark:hover:bg-white/5"
      >
        <ShareIcon className="fixed h-8 w-8 m-1" />
      </span>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-stone-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <div className="mt-2">
                        <input
                          type="text"
                          name="link"
                          value={generateLink()}
                          spellCheck="false"
                          className="block w-full rounded-md border-0 py-1.5 px-2 bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-inset focus:ring-stone-600 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 disabled:ring-stone-200 sm:text-sm sm:leading-6"
                          onFocus={handleFocus}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center items-center rounded-md bg-emerald-600 dark:bg-emerald-700 px-3 py-2 text-sm font-semibold text-stone-100 shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                      onClick={() => {
                        navigator.clipboard.writeText(generateLink());
                        setOpen(false);
                      }}
                    >
                      <ClipboardDocumentCheckIcon className="w-7 h-7 pr-2" />
                      Copy
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

export default memo(Share);
