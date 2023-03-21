export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  options: { storySort: { order: ['components', ['molecules', '*']] } },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
