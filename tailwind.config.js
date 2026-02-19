/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep Space Background
        'space': {
          black: '#0a0a0f',
          dark: '#0f0f1a',
          darker: '#050508',
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#22222e',
          500: '#2a2a38',
          400: '#3a3a4a',
        },
        // Neon Core Colors
        'neon': {
          cyan: '#00f0ff',
          purple: '#b829f7',
          pink: '#ff0080',
          blue: '#0080ff',
          green: '#00ff9d',
          yellow: '#ffee00',
          red: '#ff3333',
        },
        // Legacy Dark (for compatibility)
        'dark': {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a24',
          600: '#22222e',
          500: '#2a2a38',
          400: '#3a3a4a',
        },
        // Legacy Accent (for compatibility)
        'accent': {
          blue: '#00f0ff',
          green: '#00ff9d',
          purple: '#b829f7',
          orange: '#ffee00',
          red: '#ff3333',
          pink: '#ff0080',
        },
        // Glass Surfaces
        'glass': {
          DEFAULT: 'rgba(15, 15, 26, 0.6)',
          border: 'rgba(0, 240, 255, 0.1)',
          'border-hover': 'rgba(0, 240, 255, 0.3)',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        'tech': ['Orbitron', 'Rajdhani', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        // Neon Glows
        'neon-cyan': '0 0 5px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.1)',
        'neon-purple': '0 0 5px rgba(184, 41, 247, 0.5), 0 0 20px rgba(184, 41, 247, 0.3), 0 0 40px rgba(184, 41, 247, 0.1)',
        'neon-pink': '0 0 5px rgba(255, 0, 128, 0.5), 0 0 20px rgba(255, 0, 128, 0.3), 0 0 40px rgba(255, 0, 128, 0.1)',
        'neon-green': '0 0 5px rgba(0, 255, 157, 0.5), 0 0 20px rgba(0, 255, 157, 0.3), 0 0 40px rgba(0, 255, 157, 0.1)',
        // Card Shadows
        'card': '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card-hover': '0 8px 40px rgba(0, 240, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        // Glass Effect
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        // Glow Animations
        'pulse-glow': 'pulse-glow 2s infinite',
        'pulse-glow-purple': 'pulse-glow-purple 2s infinite',
        'pulse-glow-pink': 'pulse-glow-pink 2s infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
        // Entry Animations
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        // Shimmer
        'shimmer': 'shimmer 3s linear infinite',
        'holographic': 'holographic-shimmer 3s linear infinite',
        // Border Flow
        'border-flow': 'border-flow 3s linear infinite',
        // Float
        'float': 'float 3s ease-in-out infinite',
        // Scan
        'scan': 'scan 2s linear infinite',
        // Spin
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(0, 240, 255, 0.5), 0 0 10px rgba(0, 240, 255, 0.3)'
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.8), 0 0 40px rgba(0, 240, 255, 0.4)'
          },
        },
        'pulse-glow-purple': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(184, 41, 247, 0.5), 0 0 10px rgba(184, 41, 247, 0.3)'
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(184, 41, 247, 0.8), 0 0 40px rgba(184, 41, 247, 0.4)'
          },
        },
        'pulse-glow-pink': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(255, 0, 128, 0.5), 0 0 10px rgba(255, 0, 128, 0.3)'
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(255, 0, 128, 0.8), 0 0 40px rgba(255, 0, 128, 0.4)'
          },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'holographic-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-neon': 'linear-gradient(135deg, #00f0ff 0%, #b829f7 50%, #ff0080 100%)',
        'gradient-cyan-purple': 'linear-gradient(135deg, #00f0ff 0%, #b829f7 100%)',
        'gradient-purple-pink': 'linear-gradient(135deg, #b829f7 0%, #ff0080 100%)',
        'grid-pattern': 'linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
