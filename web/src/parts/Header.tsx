import { useState } from 'react';

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import Link from '@components/Link';
import { usePathname } from '@hooks/useAppNavigation';
import { eventsPathFor } from '@utils/routes';

import Walker from '@app/components/Walker';
import LogoSmall from '@assets/forky_logo_small.png';
import { ModeToggle } from '@components/ModeToggle';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = usePathname();

  return (
    <div className="bg-shell">
      <header className="absolute inset-x-0 top-0 z-20">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex flex-1">
            <Link href="/" className="flex gap-2 items-center -m-1.5 p-1.5">
              <img className="h-8 w-auto" src={LogoSmall} alt="" />
              <span className="text-xl font-bold text-brand">Forky</span>
            </Link>
          </div>
          <div className="flex gap-5">
            <Link
              href="/byo"
              className="inline-flex items-center justify-center rounded-md pl-2 pr-2 text-muted transition hover:bg-overlay/5"
            >
              <span className="sr-only">Bring your own fork choice</span>
              <DocumentArrowUpIcon className="h-6 w-6" aria-hidden="true" />
            </Link>
            <Link
              href={eventsPathFor(location)}
              className="inline-flex items-center justify-center rounded-md pl-2 pr-2 text-muted transition hover:bg-overlay/5"
            >
              <span className="sr-only">Open menu</span>
              <CalendarDaysIcon className="h-6 w-6" aria-hidden="true" />
            </Link>
            <ModeToggle />
            <button
              type="button"
              className=" inline-flex items-center justify-center rounded-md pl-2 pr-2 text-muted transition hover:bg-overlay/5"
              onClick={() => setMenuOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </nav>
        <Dialog open={menuOpen} onClose={setMenuOpen}>
          <DialogBackdrop
            transition
            className="fixed inset-0 z-30 bg-scrim transition-opacity duration-100 ease-in-out data-[closed]:opacity-0"
          />
          <div className="fixed inset-0 overflow-hidden z-30">
            <div className="absolute inset-0 overflow-hidden">
              <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                <DialogPanel
                  transition
                  className="fixed inset-y-0 overflow-x-hidden right-0 w-full overflow-y-auto bg-background sm:max-w-screen-lg sm:ring-1 sm:ring-overlay/10 transform transition ease-in-out duration-100 sm:duration-200 data-[closed]:translate-x-full"
                >
                  <div className="fixed opacity-10 pointer-events-none">
                    <Walker width={window.innerWidth < 1024 ? window.innerWidth : 1024} />
                  </div>
                  <div className="px-6 py-6">
                    <div className="flex flex-row-reverse">
                      <button
                        type="button"
                        className="mr-1.5 rounded-md p-1.5 text-faint transition hover:bg-overlay/5"
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
                        <h1 className="font-display text-4xl font-bold tracking-tighter hero-gradient-text sm:text-5xl lg:text-6xl">
                          An Ethereum fork choice explorer
                        </h1>
                        <div className="mt-6 space-y-6 font-display text-xl sm:text-2xl tracking-tight text-foreground">
                          <h4 className="font-display text-3xl font-bold tracking-tighter bg-clip-text">
                            About
                          </h4>
                          <p>
                            <span className="font-semibold">Forky</span> captures, stores and
                            visualizes fork choice data from the Ethereum Beacon Chain.{' '}
                            <span className="font-semibold">Forky</span> is designed to provide a
                            live view of the Ethereum network, along with historical access.
                          </p>
                          <p>
                            While the <span className="font-semibold">Forky</span> source code is
                            maintained by the Ethereum Foundation DevOps team, instances can be
                            operated by the community ❤️
                          </p>
                          <p>
                            If you&apos;d like to run your own instance of{' '}
                            <span className="font-semibold">Forky</span>, checkout out the{' '}
                            <a
                              className="underline text-link hover:text-link-hover"
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
                </DialogPanel>
              </div>
            </div>
          </div>
        </Dialog>
      </header>
    </div>
  );
}
