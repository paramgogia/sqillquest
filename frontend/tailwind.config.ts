// tailwind.config.ts

import type { Config } from 'tailwindcss';

// Function to correctly reference the CSS variable for HSL color values
const getHslVar = (name: string) => `hsl(var(--${name}))`;

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background and Foreground
        background: getHslVar('background'),
        foreground: getHslVar('foreground'),
        
        // Components
        card: getHslVar('card'),
        'card-foreground': getHslVar('card-foreground'),
        popover: getHslVar('popover'),
        'popover-foreground': getHslVar('popover-foreground'),
        
        // Primary Actions
        primary: getHslVar('primary'),
        'primary-foreground': getHslVar('primary-foreground'),
        secondary: getHslVar('secondary'),
        'secondary-foreground': getHslVar('secondary-foreground'),
        
        // Alerts and Status
        muted: getHslVar('muted'),
        'muted-foreground': getHslVar('muted-foreground'),
        accent: getHslVar('accent'),
        'accent-foreground': getHslVar('accent-foreground'),
        destructive: getHslVar('destructive'),
        'destructive-foreground': getHslVar('destructive-foreground'),
        
        // Utility/Design Tokens
        border: getHslVar('border'),
        input: getHslVar('input'),
        ring: getHslVar('ring'),
        'pixel-orange': getHslVar('pixel-orange'),
        'pixel-blue': getHslVar('pixel-blue'),
      },

      // Custom Border Radius
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: `calc(var(--radius) - 4px)`,
      },

      // Custom Background Gradients
      backgroundImage: {
        'gradient-quest': 'var(--gradient-quest)',
        'gradient-magic': 'var(--gradient-magic)',
        'gradient-treasure': 'var(--gradient-treasure)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-pixel': 'var(--gradient-pixel)',
      },
      
      // Custom Box Shadows (Glows and Outlines)
      boxShadow: {
        card: 'var(--shadow-card)',
        quest: 'var(--shadow-quest)',
        'glow-primary': 'var(--glow-primary)',
        'glow-gold': 'var(--glow-gold)',
        'glow-pixel': 'var(--glow-pixel)',
      },

      // Custom Transitions (Steps for the 8-bit look)
      transitionTimingFunction: {
        smooth: 'var(--transition-smooth)', // Note: Use transitionProperty/duration for full effect
        bounce: 'var(--transition-bounce)',
      },
    },
  },
  plugins: [
    // You might want to add 'tailwindcss-animate' or similar here for animations
  ],
};

export default config;