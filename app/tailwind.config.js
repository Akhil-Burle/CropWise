/** Design tokens live in src/styles/tokens.css as CSS variables (RGB triplets). */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        ink: v('ink'),
        'ink-muted': v('ink-muted'),
        line: v('line'),
        forest: v('forest'),
        'forest-deep': v('forest-deep'),
        'on-forest': v('on-forest'),
        clay: v('clay'),
        ochre: v('ochre'),
        chem: v('chem'),
        'chem-soft': v('chem-soft'),
        organic: v('organic'),
        'organic-soft': v('organic-soft'),
        tox: {
          red: '#C62828',
          yellow: '#F2C200',
          blue: '#1565C0',
          green: '#2E7D32',
        },
        status: {
          deficient: v('deficient'),
          sufficient: v('sufficient'),
          excess: v('excess'),
        },
        info: v('info'),
        warn: v('warn'),
        danger: v('danger'),
        success: v('success'),
      },
      fontFamily: {
        display: ['"Fraunces Variable"', 'Georgia', '"Noto Sans Devanagari"', '"Noto Sans Kannada"', 'serif'],
        sans: [
          '"Noto Sans Variable"',
          '"Noto Sans Devanagari"',
          '"Noto Sans Kannada"',
          '"Noto Sans Tamil"',
          '"Noto Sans Telugu"',
          '"Noto Sans Bengali"',
          '"Noto Sans Gujarati"',
          '"Noto Sans Malayalam"',
          '"Noto Sans Gurmukhi"',
          '"Noto Sans Oriya"',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(29,38,31,.06), 0 4px 16px rgba(29,38,31,.05)',
        pop: '0 12px 40px rgba(20,48,31,.18)',
      },
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
      maxWidth: { content: '1280px' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
