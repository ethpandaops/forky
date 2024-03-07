import { Fragment, useState } from 'react';

import { Dialog, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'wouter';

import Walker from '@app/components/Walker';
import LogoSmall from '@assets/forky_logo_small.png';
import { ModeToggle } from '@components/ModeToggle';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="bg-stone-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex flex-1">
            <Link href="/" className="flex gap-2 items-center -m-1.5 p-1.5">
              <img className="h-8 w-auto" src={LogoSmall} alt="" />
              <span className="text-xl font-bold text-stone-950 dark:text-teal-400/80">Forky</span>
            </Link>
          </div>
          <div className="flex gap-5">
            <Link
              href={`${location}${location.endsWith('/') ? '' : '/'}byo`}
              className="inline-flex items-center justify-center rounded-md pl-2 pr-2 text-stone-700 dark:text-stone-300 transition hover:bg-stone-900/5 dark:hover:bg-white/5"
            >
              <span className="sr-only">Bring your own fork choice</span>
              <DocumentArrowUpIcon className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              href={`${location}${location.endsWith('/') ? '' : '/'}events`}
              className="inline-flex items-center justify-center rounded-md pl-2 pr-2 text-stone-700 dark:text-stone-300 transition hover:bg-stone-900/5 dark:hover:bg-white/5"
            >
              <span className="sr-only">Open menu</span>
              <CalendarDaysIcon className="h-6 w-6" aria-hidden="true" />
            </Link>
            <ModeToggle />
            <button
              type="button"
              className=" inline-flex items-center justify-center rounded-md pl-2 pr-2 text-stone-700 dark:text-stone-300 transition hover:bg-stone-900/5 dark:hover:bg-white/5"
              onClick={() => setMenuOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </nav>
        <Transition.Root show={menuOpen} as={Fragment}>
          <Dialog as="div" onClose={setMenuOpen}>
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-stone-300 bg-opacity-75 transition-opacity z-30" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-hidden z-30">
              <div className="absolute inset-0 overflow-hidden">
                <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                  <Transition.Child
                    as={Fragment}
                    enter="transform transition ease-in-out duration-100 sm:duration-200"
                    enterFrom="translate-x-full"
                    enterTo="translate-x-0"
                    leave="transform transition ease-in-out duration-100 sm:duration-200"
                    leaveFrom="translate-x-0"
                    leaveTo="translate-x-full"
                  >
                    <Dialog.Panel className="fixed inset-y-0 overflow-x-hidden right-0 w-full overflow-y-auto bg-stone-100 dark:bg-stone-900 sm:max-w-screen-lg sm:ring-1 sm:ring-white/10">
                      <div className="fixed opacity-10 pointer-events-none">
                        <Walker width={window.innerWidth < 1024 ? window.innerWidth : 1024} />
                      </div>
                      <div className="px-6 py-6">
                        <div className="flex flex-row-reverse">
                          <button
                            type="button"
                            className="mr-1.5 rounded-md p-1.5 text-stone-400 transition hover:bg-stone-900/5 dark:hover:bg-white/5"
                            onClick={() => setMenuOpen(false)}
                          >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon className="h-7 w-7" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="relative pt-10 pb-20 sm:py-12">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                          <div className="mx-auto max-w-2xl lg:max-w-4xl lg:px-12">
                            <h1 className="font-display text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-lime-600 dark:from-lime-200 dark:via-green-200 dark:to-green-300 sm:text-5xl lg:text-6xl">
                              An Ethereum fork choice explorer
                            </h1>
                            <div className="mt-6 space-y-6 font-display text-xl sm:text-2xl tracking-tight text-stone-900 dark:text-stone-100">
                              <h4 className="font-display text-3xl font-bold tracking-tighter bg-clip-text">
                                About
                              </h4>
                              <p>
                                <span className="font-semibold">Forky</span> captures, stores and
                                visualizes fork choice data from the Ethereum Beacon Chain.{' '}
                                <span className="font-semibold">Forky</span> is designed to provide
                                a live view of the Ethereum network, along with historical access.
                              </p>
                              <p>
                                While the <span className="font-semibold">Forky</span> source code
                                is maintained by the Ethereum Foundation DevOps team, instances can
                                be operated by the community ❤️
                              </p>
                              <p>
                                If you&apos;d like to run your own instance of{' '}
                                <span className="font-semibold">Forky</span>, checkout out the{' '}
                                <a
                                  className="underline text-green-500 hover:text-green-600 dark:text-green-200 dark:hover:text-green-300"
                                  href="https://github.com/ethpandaops/forky"
                                >
                                  Github repository
                                </a>{' '}
                                for instructions.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </header>
    </div>
  );
}
