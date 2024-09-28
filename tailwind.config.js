module.exports = {
  prefix: 'tw-',
  content: [
    './layout/*.liquid',
    './templates/*.liquid',
    './templates/customers/*.liquid',
    './sections/*.liquid',
    './snippets/*.liquid',
    './assets/*.css',
  ],
  theme: {
    screens: {
      sm: '320px',
      md: '750px',
      lg: '990px',
      xlg: '1440px',
      x2lg: '1920px',
      pageMaxWidth: '1440px',
    },
    extend: {
      fontFamily: {
        heading: 'var(--font-heading-family)',
      },
      animation: {
        'pulse-fast': 'pulse-fast 0.9s infinite',
      },
      boxShadow: {
        'orange-glow-dark': `0 0 30px 0px rgba(255, 155, 0, 0.3),0 0 60px 30px rgba(255, 155, 0, 0.15),0 0 120px 60px rgba(255, 155, 0, 0.05), 0 0 200px 100px rgba(255, 155, 0, 0.03)`,
        'orange-glow-light': `0 0 30px 0px rgba(255, 155, 0, 0.6),0 0 60px 30px rgba(255, 155, 0, 0.3),0 0 120px 60px rgba(255, 155, 0, 0.1), 0 0 200px 100px rgba(255, 155, 0, 0.06)`,
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function ({ addBase, theme }) {
      function extractColorVars(colorObj, colorGroup = '') {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey];

          const newVars =
            typeof value === 'string'
              ? { [`--tw-color${colorGroup}-${colorKey}`]: value }
              : extractColorVars(value, `-${colorKey}`);

          return { ...vars, ...newVars };
        }, {});
      }

      addBase({
        ':root': extractColorVars(theme('colors')),
      });
    },
  ],
};
