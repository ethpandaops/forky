export function hasDarkPreference() {
  if (window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return darkModeMediaQuery.matches;
  }
  return false;
}

export function hasDarkLocalStorage() {
  if (!window.localStorage) return false;
  return window.localStorage.isDarkMode === 'true';
}
