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
import ForkyMarkSmall from '@assets/forky-mark-small.svg';
import { ModeToggle } from '@components/ModeToggle';
import useEthereum from '@contexts/ethereum';

const ICON_BUTTON =
  'inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = usePathname();
  const { networkName } = useEthereum();

  return (
    <header className="glass-chrome absolute inset-x-0 top-0 z-20 border-b border-border">
      <nav
        className="flex h-12 items-center justify-between gap-3 px-3 sm:px-5"
        aria-label="Global"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href="/"
            className="-m-1 flex shrink-0 items-center gap-2 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <img className="size-7 shrink-0" src={ForkyMarkSmall} alt="" />
            <span className="hero-gradient-text text-base font-bold tracking-tight">FORKY</span>
          </Link>
          <span className="hidden truncate rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px]/4 uppercase tracking-wider text-muted sm:inline-block">
            {networkName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/byo" className={ICON_BUTTON} title="Bring your own fork choice">
            <span className="sr-only">Bring your own fork choice</span>
            <DocumentArrowUpIcon className="size-5" aria-hidden="true" />
          </Link>
          <Link href={eventsPathFor(location)} className={ICON_BUTTON} title="Events">
            <span className="sr-only">Open events</span>
            <CalendarDaysIcon className="size-5" aria-hidden="true" />
          </Link>
          <ModeToggle />
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <button type="button" className={ICON_BUTTON} onClick={() => setMenuOpen(true)}>
            <span className="sr-only">Open menu</span>
            <Bars3Icon className="size-5" aria-hidden="true" />
          </button>
        </div>
      </nav>
      <Dialog open={menuOpen} onClose={setMenuOpen}>
        <DialogBackdrop
          transition
          className="fixed inset-0 z-30 bg-scrim backdrop-blur-xs transition-opacity duration-150 ease-out data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 z-30 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <DialogPanel
                transition
                className="fixed inset-y-0 right-0 w-full transform overflow-x-hidden overflow-y-auto border-l border-border bg-background transition duration-150 ease-out data-[closed]:translate-x-full sm:max-w-screen-lg sm:duration-200"
              >
                <div className="pointer-events-none fixed opacity-10">
                  <Walker width={window.innerWidth < 1024 ? window.innerWidth : 1024} />
                </div>
                <div className="px-6 py-6">
                  <div className="flex flex-row-reverse">
                    <button
                      type="button"
                      className="mr-1.5 rounded-md p-1.5 text-faint transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="size-7" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="relative pt-10 pb-20 sm:py-12">
                  <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-4xl lg:px-12">
                      <p className="font-mono text-xs uppercase tracking-widest text-accent">
                        Mission control for the Beacon Chain
                      </p>
                      <h1 className="hero-gradient-text mt-3 font-display text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl">
                        An Ethereum fork choice explorer
                      </h1>
                      <div className="mt-8 space-y-6 font-display text-lg/8 tracking-tight text-foreground sm:text-xl/8">
                        <h4 className="font-display text-2xl font-bold tracking-tighter text-foreground-strong">
                          About
                        </h4>
                        <p>
                          <span className="font-semibold">Forky</span> captures, stores and
                          visualizes fork choice data from the Ethereum Beacon Chain.{' '}
                          <span className="font-semibold">Forky</span> is designed to provide a live
                          view of the Ethereum network, along with historical access.
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
                            className="text-link underline decoration-border-strong underline-offset-4 transition-colors duration-150 hover:text-link-hover"
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
  );
}
