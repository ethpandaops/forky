/*
 * Technically, tailwind config could be imported and the colors be extracted from there.
 * However this adds ~100kb to the production bundle size, so we'll just hardcode them here
 * for colors that are used in canvas/webgl components.
 *
 * https://tailwindcss.com/docs/configuration#referencing-in-java-script
 */

export const colors = {
  stone: {
    50: '#fafaf9',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },
  emerald: {
    600: '#059669',
    800: '#065f46',
  },
  amber: {
    600: '#d97706',
    800: '#92400e',
  },
  indigo: {
    600: '#4f46e5',
    800: '#3730a3',
  },
  fuchsia: {
    600: '#c026d3',
    800: '#86198f',
  },
  rose: {
    600: '#e11d48',
    800: '#9f1239',
  },
};

export const fonts = {
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
};
