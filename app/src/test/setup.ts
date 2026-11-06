import '@testing-library/jest-dom/vitest';
import '@/i18n';

// jsdom lacks these browser APIs used by the UI.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
window.scrollTo = () => undefined;
