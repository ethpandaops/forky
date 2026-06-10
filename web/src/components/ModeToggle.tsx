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
      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-overlay/5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label="Toggle dark mode"
      onClick={toggleMode}
    >
      <SunIcon className="size-5 stroke-warning text-warning dark:hidden" />
      <MoonIcon className="hidden size-5 stroke-foreground dark:block" />
    </button>
  );
}
