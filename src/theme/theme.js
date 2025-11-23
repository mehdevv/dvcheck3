// Chakra UI v3 uses a different theming approach
// For v3, we'll use default theme and customize via CSS variables and component props
// This file exports theme configuration that can be used with ChakraProvider

const theme = {
  // Chakra UI v3 uses CSS variables for theming
  // Custom colors can be defined and used directly in components
  colors: {
    brand: {
      50: '#E6F2FF',
      100: '#B3D9FF',
      200: '#80BFFF',
      300: '#4DA6FF',
      400: '#1A8CFF',
      500: '#007AFF', // Primary blue
      600: '#0051D5',
      700: '#0038AA',
      800: '#001F7F',
      900: '#000654',
    },
  },
};

export default theme;

