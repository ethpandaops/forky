import { useState } from 'react';

import { Dialog } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';

import SelectMenu from '@components/SelectMenu';

export default function Header({ className }: { className?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={classNames('sticky', className)}>
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8 z-10"
        aria-label="Global"
      >
        <div className="flex lg:hidden"></div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          <div>
            <SelectMenu
              id="network"
              data={[
                { id: 1, name: 'Mainnet' },
                { id: 2, name: 'Goerli' },
                { id: 3, name: 'Sepolia' },
              ]}
              initialSelectedIndex={0}
              label="Network"
            />
          </div>
          <div>
            <SelectMenu
              id="consensus-client"
              data={[
                { id: 1, name: 'All' },
                { id: 2, name: 'prysm' },
              ]}
              initialSelectedIndex={0}
              label="Consensus Client"
            />
          </div>
          <div>
            <SelectMenu
              id="source"
              data={[
                { id: 1, name: 'All' },
                { id: 2, name: 'xyz123' },
              ]}
              initialSelectedIndex={0}
              label="Source"
            />
          </div>
        </div>
      </nav>
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <img
                className="h-8 w-auto"
                src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                alt=""
              />
            </a>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}
