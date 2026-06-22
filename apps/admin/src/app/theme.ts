import {
  createTheme,
  type MantineColorsTuple,
  type MantineTheme,
} from '@mantine/core';

const parfumGreen: MantineColorsTuple = [
  '#e8f0ec',
  '#d0e3d8',
  '#a8cdb8',
  '#7fb396',
  '#569a75',
  '#3d7f5d',
  '#2d6649',
  '#234d3b',
  '#1a3d2e',
  '#0f2419',
];

export const adminTheme = createTheme({
  primaryColor: 'parfum',
  colors: {
    parfum: parfumGreen,
  },
  defaultRadius: 'md',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: { fontWeight: '600' },
  components: {
    Notification: {
      defaultProps: {
        variant: 'filled',
        color: 'parfum',
        withBorder: true,
      },
      styles: (theme: MantineTheme) => ({
        root: {
          backgroundColor: theme.colors.parfum[7],
          borderColor: theme.colors.parfum[8],
          color: theme.white,
          backgroundImage: 'none',
        },
        title: { color: theme.white },
        description: { color: 'rgba(247, 243, 235, 0.92)' },
        closeButton: { color: theme.white, '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' } },
      }),
    },
  },
});
