import { useEffect } from 'react';

import { MoonIcon, SunIcon } from '@heroicons/react/20/solid';
import { hasDarkLocalStorage, hasDarkPreference } from '@utils/darkmode';

export function ModeToggle() {
  useEffect(() => {
    if (hasDarkLocalStorage() || hasDarkPreference()) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  function disableTransitionsTemporarily() {
    document.documentElement.classList.add('[&_*]:!transition-none');
    window.setTimeout(() => {
      document.documentElement.classList.remove('[&_*]:!transition-none');
    }, 0);
  }

  function toggleMode() {
    disableTransitionsTemporarily();

    const isDarkMode = document.documentElement.classList.toggle('dark');
    if (window.localStorage) {
      if (isDarkMode === hasDarkPreference()) {
        delete window.localStorage.isDarkMode;
      } else {
        window.localStorage.isDarkMode = isDarkMode;
      }
    }
  }

  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-md transition hover:bg-stone-900/5 dark:hover:bg-white/5"
      aria-label="Toggle dark mode"
      onClick={toggleMode}
    >
      <SunIcon className="h-6 w-6 stroke-amber-500 text-amber-600 dark:hidden" />
      <MoonIcon className="hidden h-6 w-6 stroke-stone-100 dark:block" />
    </button>
  );
}
